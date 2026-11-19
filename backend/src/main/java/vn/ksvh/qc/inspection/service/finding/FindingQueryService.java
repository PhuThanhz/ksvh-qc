package vn.ksvh.qc.inspection.service.finding;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.criteria.api.CriteriaLookupApi;
import vn.ksvh.qc.criteria.api.CriterionRef;
import vn.ksvh.qc.inspection.domain.*;
import vn.ksvh.qc.inspection.dto.*;
import vn.ksvh.qc.inspection.service.InspectionAccess;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.shared.web.PageResponse;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FindingQueryService {

    private final FindingRepository findingRepository;
    private final InspectionRepository inspectionRepository;
    private final AppealReviewRepository appealReviewRepository;
    private final OrgUnitLookupApi orgUnitLookupApi;
    private final CriteriaLookupApi criteriaLookupApi;
    private final UserAccountApi userAccountApi;
    private final InspectionAccess access;
    private final FindingLifecycle lifecycle;

    public PageResponse<FindingResponse> search(String keyword, Long restaurantId, Long inspectionId, FindingStatus status,
                                                Pageable pageable, CurrentUser user) {
        Specification<Finding> spec = Specification.unrestricted();
        Specification<Finding> scope = access.canReadAll(user) ? null
                : access.findingScope(user, inspectionRepository.findIdsByInspectorId(user.id()));
        if (scope != null) {
            spec = spec.and(scope);
        }
        if (StringUtils.hasText(keyword)) {
            String kw = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("description")), kw),
                    cb.like(cb.lower(root.get("riskLevelCode")), kw),
                    cb.like(cb.lower(root.get("appealReason")), kw),
                    cb.like(cb.lower(root.get("remediationPlan")), kw)
            ));
        }
        if (restaurantId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("restaurantId"), restaurantId));
        }
        if (inspectionId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("inspectionId"), inspectionId));
        }
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }

        var page = findingRepository.findAll(spec, pageable);

        var resIds = page.getContent().stream().map(Finding::getRestaurantId).distinct().toList();
        var critIds = page.getContent().stream().map(Finding::getCriterionId).distinct().toList();
        var insIds = page.getContent().stream().map(Finding::getInspectionId).distinct().toList();
        var findingIds = page.getContent().stream().map(Finding::getId).toList();

        List<AppealReview> allReviews = appealReviewRepository.findByFindingIdIn(findingIds);
        Map<Long, List<AppealReview>> reviewsByFinding = allReviews.stream()
                .collect(Collectors.groupingBy(AppealReview::getFindingId));

        var userIds = Stream.concat(
                        page.getContent().stream().flatMap(f -> Stream.of(f.getVerifiedBy(), f.getAppealConcludedBy())),
                        allReviews.stream().map(AppealReview::getReviewerId)
                )
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<Long, OrgUnitRef> restaurants = orgUnitLookupApi.findRefs(resIds);
        Map<Long, CriterionRef> criteria = criteriaLookupApi.findCriteria(critIds);
        Map<Long, Inspection> inspections = inspectionRepository.findAllById(insIds).stream()
                .collect(Collectors.toMap(Inspection::getId, Function.identity()));
        Map<Long, UserSummary> users = userAccountApi.findSummaries(userIds);

        return PageResponse.of(page, f -> {
            OrgUnitRef r = restaurants.get(f.getRestaurantId());
            CriterionRef c = criteria.get(f.getCriterionId());
            Inspection ins = inspections.get(f.getInspectionId());
            List<AppealReview> fReviews = reviewsByFinding.getOrDefault(f.getId(), List.of()).stream()
                    .filter(ar -> ar.getAppealRound() == f.getAppealRound())
                    .toList();
            List<AppealReviewResponse> arResponses = fReviews.stream()
                    .map(ar -> AppealReviewResponse.from(ar, FindingLifecycle.nameOf(users, ar.getReviewerId())))
                    .toList();

            return FindingResponse.from(f,
                    ins != null ? ins.getCode() : null,
                    r != null ? r.name() : null,
                    c != null ? c.code() : null,
                    c != null ? c.name() : null,
                    FindingLifecycle.nameOf(users, f.getVerifiedBy()),
                    FindingLifecycle.nameOf(users, f.getAppealConcludedBy()),
                    List.of(),
                    arResponses
            );
        });
    }

    public FindingResponse get(Long id, CurrentUser user) {
        Finding f = lifecycle.load(id);
        access.requireRead(lifecycle.inspectionOf(f), user);
        return lifecycle.toResponse(f);
    }

    public List<CandidateReviewerResponse> getCandidateReviewers(Long id, CurrentUser user) {
        Finding f = lifecycle.load(id);
        Inspection ins = lifecycle.inspectionOf(f);
        access.requireRead(ins, user);
        Long excludedInspectorId = ins.getInspectorId();

        List<String> targetRoles = List.of(
                RoleCodes.KSVH_LEAD,
                RoleCodes.KSVH_MANAGER,
                RoleCodes.KSVH_INSPECTOR,
                RoleCodes.OBM
        );
        List<UserSummary> candidates = userAccountApi.findActiveUsersByRoleIn(targetRoles);
        Set<Long> obmUserIds = candidates.stream()
                .filter(u -> u.hasRole(RoleCodes.OBM)
                        && !u.hasRole(RoleCodes.KSVH_LEAD)
                        && !u.hasRole(RoleCodes.KSVH_MANAGER)
                        && !u.hasRole(RoleCodes.KSVH_INSPECTOR))
                .map(UserSummary::id)
                .collect(Collectors.toSet());
        Set<Long> obmIdsForRestaurant = new HashSet<>();
        if (!obmUserIds.isEmpty()) {
            OrgUnitRef rest = orgUnitLookupApi.findRefs(List.of(f.getRestaurantId())).get(f.getRestaurantId());
            if (rest != null && rest.obmUserId() != null) {
                obmIdsForRestaurant.add(rest.obmUserId());
            }
            if (rest != null && rest.storeManagerUserId() != null) {
                obmIdsForRestaurant.add(rest.storeManagerUserId());
            }
        }

        return candidates.stream()
                .filter(u -> !Objects.equals(u.id(), excludedInspectorId))
                .filter(u -> {
                    boolean isKsvh = u.hasRole(RoleCodes.KSVH_LEAD)
                            || u.hasRole(RoleCodes.KSVH_MANAGER)
                            || u.hasRole(RoleCodes.KSVH_INSPECTOR);
                    if (isKsvh) {
                        return true;
                    }
                    if (u.hasRole(RoleCodes.OBM)) {
                        return obmIdsForRestaurant.contains(u.id());
                    }
                    return false;
                })
                .map(u -> {
                    boolean isKsvh = u.hasRole(RoleCodes.KSVH_LEAD)
                            || u.hasRole(RoleCodes.KSVH_MANAGER)
                            || u.hasRole(RoleCodes.KSVH_INSPECTOR);
                    return new CandidateReviewerResponse(u.id(), u.username(), u.fullName(), isKsvh, u.roles());
                })
                .sorted(Comparator.comparing(CandidateReviewerResponse::ksvhRep).reversed()
                        .thenComparing(CandidateReviewerResponse::fullName))
                .toList();
    }

    public List<FindingResponse> getPendingReviews(CurrentUser user) {
        List<Long> findingIds = appealReviewRepository.findPendingFindingIdsByReviewerId(user.id());
        if (findingIds.isEmpty()) {
            return List.of();
        }
        return findingRepository.findAllById(findingIds).stream()
                .filter(f -> f.getStatus() == FindingStatus.APPEALED)
                .map(lifecycle::toResponse)
                .toList();
    }

    public List<CandidateFindingResponse> listCandidatesForVerification(Long restaurantId, CurrentUser user) {
        List<Finding> list = findingRepository.findByRestaurantIdAndStatusIn(restaurantId,
                List.of(FindingStatus.PENDING_VERIFICATION));
        if (list.isEmpty()) {
            return List.of();
        }
        var insIds = list.stream().map(Finding::getInspectionId).distinct().toList();
        var critIds = list.stream().map(Finding::getCriterionId).distinct().toList();
        Map<Long, Inspection> insMap = inspectionRepository.findAllById(insIds).stream()
                .collect(Collectors.toMap(Inspection::getId, Function.identity()));
        Map<Long, CriterionRef> critMap = criteriaLookupApi.findCriteria(critIds);

        return list.stream().map(f -> {
            Inspection ins = insMap.get(f.getInspectionId());
            CriterionRef c = critMap.get(f.getCriterionId());
            return new CandidateFindingResponse(
                    f.getId(),
                    f.getInspectionId(),
                    ins != null ? ins.getCode() : null,
                    f.getCriterionId(),
                    c != null ? c.code() : ("C" + f.getCriterionId()),
                    c != null ? c.name() : ("Tiêu chí #" + f.getCriterionId()),
                    c != null ? c.groupName() : null,
                    f.getBaseImpact(),
                    f.getEffectiveImpact(),
                    f.getRiskLevelCode(),
                    f.getCalculatedScore(),
                    f.getStatus(),
                    f.getDescription(),
                    f.getEvidenceUrls(),
                    f.getRemediationPlan(),
                    f.getRemediationEvidenceUrls(),
                    f.getRemediationSubmittedAt(),
                    f.getDeadlineDate()
            );
        }).toList();
    }
}

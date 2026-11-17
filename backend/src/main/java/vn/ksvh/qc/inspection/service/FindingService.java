package vn.ksvh.qc.inspection.service;

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
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.risk.RiskAssessment;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.NotFoundException;
import vn.ksvh.qc.shared.util.BusinessDates;
import vn.ksvh.qc.shared.web.PageResponse;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FindingService {

    private final FindingRepository findingRepository;
    private final FindingOccurrenceRepository occurrenceRepository;
    private final InspectionRepository inspectionRepository;
    private final InspectionItemRepository itemRepository;
    private final CriteriaLookupApi criteriaLookupApi;
    private final OrgUnitLookupApi orgUnitLookupApi;
    private final FindingEventRepository eventRepository;
    private final UserAccountApi userAccountApi;
    private final InspectionAccess access;
    private final RiskAssessor riskAssessor;
    private final Clock clock;

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
        var userIds = page.getContent().stream()
                .flatMap(f -> Stream.of(f.getVerifiedBy(), f.getAppealConcludedBy()))
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
            return FindingResponse.from(f,
                    ins != null ? ins.getCode() : null,
                    r != null ? r.name() : null,
                    c != null ? c.code() : null,
                    c != null ? c.name() : null,
                    nameOf(users, f.getVerifiedBy()),
                    nameOf(users, f.getAppealConcludedBy())
            );
        });
    }

    public FindingResponse get(Long id, CurrentUser user) {
        Finding f = load(id);
        access.requireRead(inspectionOf(f), user);
        return toResponse(f);
    }

    @Transactional
    public FindingResponse confirm(Long id, CurrentUser user) {
        Finding f = load(id);
        access.requireStoreManager(f.getRestaurantId(), user);
        requireStatus(f, "Lỗi này không ở trạng thái chờ xác nhận", FindingStatus.OPEN);
        transition(f, FindingStatus.CONFIRMED, FindingEventAction.CONFIRMED, user, null);
        addOccurrence(f, OccurrenceSource.CONFIRMED);
        return save(f);
    }

    @Transactional
    public FindingResponse appeal(Long id, FindingAppealRequest req, CurrentUser user) {
        Finding f = load(id);
        access.requireStoreManager(f.getRestaurantId(), user);
        requireStatus(f, "Lỗi này không ở trạng thái có thể khiếu nại", FindingStatus.OPEN);
        f.setAppealReason(req.appealReason().trim());
        f.setAppealEvidenceUrls(req.appealEvidenceUrls());
        f.setAppealSubmittedAt(clock.instant());
        transition(f, FindingStatus.APPEALED, FindingEventAction.APPEALED, user, f.getAppealReason());
        return save(f);
    }

    @Transactional
    public FindingResponse concludeAppeal(Long id, FindingConcludeAppealRequest req, CurrentUser user) {
        Finding f = load(id);
        requireStatus(f, "Lỗi này không ở trạng thái đang khiếu nại", FindingStatus.APPEALED);
        f.setAppealConclusion(req.conclusion());
        f.setAppealConcludedBy(user.id());

        if (req.conclusion() == AppealConclusion.UPHELD) {
            transition(f, FindingStatus.CONFIRMED, FindingEventAction.APPEAL_UPHELD, user, null);
            addOccurrence(f, OccurrenceSource.APPEAL_UPHELD);
        } else {
            transition(f, FindingStatus.DISMISSED, FindingEventAction.APPEAL_DISMISSED, user, null);
            itemRepository.findById(f.getInspectionItemId()).ifPresent(item -> {
                item.setResult(ItemResult.PASS);
                String note = "Khiếu nại được chấp thuận: Lỗi đã được huỷ bỏ";
                item.setComment(item.getComment() != null ? item.getComment() + " (" + note + ")" : note);
                itemRepository.save(item);
            });
        }
        FindingResponse res = save(f);
        completeInspectionIfDone(f.getInspectionId());
        return res;
    }

    @Transactional
    public FindingResponse setRemediationPlan(Long id, FindingRemediationPlanRequest req, CurrentUser user) {
        Finding f = load(id);
        access.requireStoreManager(f.getRestaurantId(), user);
        requireStatus(f, "Chỉ có thể lập kế hoạch khắc phục cho lỗi đã xác nhận", FindingStatus.CONFIRMED);

        // Ngày hẹn do CHT chọn nhưng không được vượt hạn khắc phục server đã tính theo mức rủi ro.
        // Nếu hạn cũ đã quá ngày hôm nay (vòng lặp lại hoặc quá hạn), hạn tối đa tính từ hôm nay.
        LocalDate today = BusinessDates.today(clock);
        LocalDate target = req.remediationDeadline();
        if (target.isBefore(today)) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Ngày hẹn khắc phục không được ở quá khứ");
        }
        LocalDate maxDeadline = (f.getDeadlineDate() == null || f.getDeadlineDate().isBefore(today))
                ? today.plusDays(f.getRemediationDays())
                : f.getDeadlineDate();
        if (target.isAfter(maxDeadline)) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Ngày hẹn khắc phục không được sau hạn %s của mức rủi ro %s".formatted(maxDeadline, f.getRiskLevelCode()));
        }
        if (f.getDeadlineDate() == null || f.getDeadlineDate().isBefore(today)) {
            f.setDeadlineDate(maxDeadline);
        }
        f.setRemediationPlan(req.remediationPlan().trim());
        f.setRemediationTargetDate(target);
        transition(f, FindingStatus.REMEDIATING, FindingEventAction.REMEDIATION_PLANNED, user,
                "Hẹn hoàn thành " + target + ": " + f.getRemediationPlan());
        return save(f);
    }

    @Transactional
    public FindingResponse submitRemediation(Long id, FindingSubmitRemediationRequest req, CurrentUser user) {
        Finding f = load(id);
        access.requireStoreManager(f.getRestaurantId(), user);
        requireStatus(f, "Cần lập kế hoạch khắc phục trước khi gửi bằng chứng", FindingStatus.REMEDIATING);
        f.setRemediationEvidenceUrls(req.remediationEvidenceUrls().trim());
        f.setRemediationSubmittedAt(clock.instant());
        transition(f, FindingStatus.PENDING_VERIFICATION, FindingEventAction.REMEDIATION_SUBMITTED, user, null);
        return save(f);
    }

    @Transactional
    public FindingResponse verify(Long id, FindingVerifyRequest req, CurrentUser user) {
        Finding f = load(id);
        access.requireVerifier(inspectionOf(f), user);
        requireStatus(f, "Lỗi này chưa gửi bằng chứng khắc phục để nghiệm thu", FindingStatus.PENDING_VERIFICATION);
        f.setVerifiedBy(user.id());
        f.setVerifiedAt(clock.instant());
        f.setVerificationComment(StringUtils.hasText(req.comment()) ? req.comment().trim() : null);

        if (Boolean.TRUE.equals(req.passed())) {
            transition(f, FindingStatus.CLOSED, FindingEventAction.VERIFY_PASSED, user, f.getVerificationComment());
        } else {
            // Chưa đạt: +1 tần suất, tính lại điểm / mức, mở vòng mới để CHT lập lại kế hoạch (DOMAIN_SPEC bước 5).
            // Hạn khắc phục giữ nguyên cho tới khi chốt câu hỏi Q4 (tính lại hạn mỗi vòng hay không).
            reassess(f);
            transition(f, FindingStatus.CONFIRMED, FindingEventAction.VERIFY_FAILED, user, f.getVerificationComment());
            addOccurrence(f, OccurrenceSource.VERIFY_FAILED);
        }
        FindingResponse res = save(f);
        completeInspectionIfDone(f.getInspectionId());
        return res;
    }

    private void transition(Finding f, FindingStatus to, FindingEventAction action, CurrentUser user, String note) {
        FindingStatus from = f.getStatus();
        f.setStatus(to);
        eventRepository.save(new FindingEvent(f.getId(), action, from, to, user.id(), note, clock.instant()));
    }

    /** Tính lại tần suất, mức ảnh hưởng hiệu lực, điểm và mức rủi ro trước khi ghi lần +1. */
    private void reassess(Finding f) {
        RiskAssessment r = riskAssessor.assessNew(f.getRestaurantId(), f.getCriterionId(), f.getBaseImpact(), BusinessDates.today(clock));
        f.setEffectiveImpact((short) r.effectiveImpact());
        f.setViolationCount(r.frequency());
        f.setCalculatedScore(r.score());
        f.setRiskLevelCode(r.band().code());
        f.setRiskLevelName(r.band().name());
        f.setRemediationDays(r.band().remediationDays());
    }

    private void addOccurrence(Finding f, OccurrenceSource source) {
        occurrenceRepository.save(new FindingOccurrence(f.getRestaurantId(), f.getCriterionId(), f.getId(), source, clock.instant()));
    }

    private static void requireStatus(Finding f, String message, FindingStatus expected) {
        if (f.getStatus() != expected) {
            throw new BusinessException(ErrorCode.FINDING_INVALID_STATE, message);
        }
    }

    /** Mọi lỗi của phiếu đã đóng hoặc bị bỏ → phiếu hoàn thành. */
    private void completeInspectionIfDone(Long inspectionId) {
        List<Finding> list = findingRepository.findByInspectionId(inspectionId);
        boolean allFinished = list.stream().allMatch(it -> it.getStatus() == FindingStatus.CLOSED || it.getStatus() == FindingStatus.DISMISSED);
        if (!allFinished) {
            return;
        }
        inspectionRepository.findById(inspectionId)
                .filter(ins -> ins.getStatus() == InspectionStatus.SUBMITTED)
                .ifPresent(ins -> {
                    ins.setStatus(InspectionStatus.COMPLETED);
                    ins.setCompletedAt(clock.instant());
                });
    }

    private FindingResponse save(Finding f) {
        return toResponse(findingRepository.saveAndFlush(f));
    }

    private FindingResponse toResponse(Finding f) {
        var rest = orgUnitLookupApi.findRefs(List.of(f.getRestaurantId())).get(f.getRestaurantId());
        var crit = criteriaLookupApi.findCriteria(List.of(f.getCriterionId())).get(f.getCriterionId());
        var ins = inspectionRepository.findById(f.getInspectionId()).orElse(null);
        List<FindingEvent> events = eventRepository.findByFindingIdOrderByCreatedAtAscIdAsc(f.getId());
        var users = userAccountApi.findSummaries(Stream.concat(
                        Stream.of(f.getVerifiedBy(), f.getAppealConcludedBy()),
                        events.stream().map(FindingEvent::getActorId))
                .filter(Objects::nonNull).distinct().toList());

        return FindingResponse.from(f,
                ins != null ? ins.getCode() : null,
                rest != null ? rest.name() : null,
                crit != null ? crit.code() : null,
                crit != null ? crit.name() : null,
                nameOf(users, f.getVerifiedBy()),
                nameOf(users, f.getAppealConcludedBy()),
                events.stream().map(e -> FindingEventResponse.from(e, nameOf(users, e.getActorId()))).toList()
        );
    }

    private static String nameOf(Map<Long, UserSummary> users, Long id) {
        UserSummary u = id == null ? null : users.get(id);
        return u != null ? u.fullName() : null;
    }

    private Inspection inspectionOf(Finding f) {
        return inspectionRepository.findById(f.getInspectionId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu chấm #" + f.getInspectionId()));
    }

    private Finding load(Long id) {
        return findingRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy lỗi vi phạm #" + id));
    }
}

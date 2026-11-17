package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.criteria.api.CriteriaLookupApi;
import vn.ksvh.qc.criteria.api.CriterionRef;
import vn.ksvh.qc.inspection.api.event.AppealMeetingRequiredEvent;
import vn.ksvh.qc.inspection.api.event.FindingAppealConcludedEvent;
import vn.ksvh.qc.inspection.api.event.FindingAppealedEvent;
import vn.ksvh.qc.inspection.api.event.FindingOverdueEvent;
import vn.ksvh.qc.inspection.api.event.FindingReminderDueEvent;
import vn.ksvh.qc.inspection.api.event.FindingVerifiedEvent;
import vn.ksvh.qc.inspection.api.event.RemediationSubmittedEvent;
import vn.ksvh.qc.inspection.domain.AppealConclusion;
import vn.ksvh.qc.inspection.domain.AppealReview;
import vn.ksvh.qc.inspection.domain.AppealReviewRepository;
import vn.ksvh.qc.inspection.domain.AppealVerdict;
import vn.ksvh.qc.inspection.domain.Finding;
import vn.ksvh.qc.inspection.domain.FindingEvent;
import vn.ksvh.qc.inspection.domain.FindingEventAction;
import vn.ksvh.qc.inspection.domain.FindingEventRepository;
import vn.ksvh.qc.inspection.domain.FindingOccurrence;
import vn.ksvh.qc.inspection.domain.FindingOccurrenceRepository;
import vn.ksvh.qc.inspection.domain.FindingRepository;
import vn.ksvh.qc.inspection.domain.FindingStatus;
import vn.ksvh.qc.inspection.domain.Inspection;
import vn.ksvh.qc.inspection.domain.InspectionItem;
import vn.ksvh.qc.inspection.domain.InspectionItemRepository;
import vn.ksvh.qc.inspection.domain.InspectionRepository;
import vn.ksvh.qc.inspection.domain.InspectionStatus;
import vn.ksvh.qc.inspection.domain.ItemResult;
import vn.ksvh.qc.inspection.domain.OccurrenceSource;
import vn.ksvh.qc.inspection.dto.AppealReviewRequest;
import vn.ksvh.qc.inspection.dto.AppealReviewResponse;
import vn.ksvh.qc.inspection.dto.CandidateFindingResponse;
import vn.ksvh.qc.inspection.dto.CandidateReviewerResponse;
import vn.ksvh.qc.inspection.dto.FindingAppealRequest;
import vn.ksvh.qc.inspection.dto.FindingConcludeAppealRequest;
import vn.ksvh.qc.inspection.dto.FindingEventResponse;
import vn.ksvh.qc.inspection.dto.FindingRemediationPlanRequest;
import vn.ksvh.qc.inspection.dto.FindingResponse;
import vn.ksvh.qc.inspection.dto.FindingSubmitRemediationRequest;
import vn.ksvh.qc.inspection.dto.FindingVerifyRequest;
import vn.ksvh.qc.media.api.EvidenceApi;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.risk.RiskAssessment;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.NotFoundException;
import vn.ksvh.qc.shared.util.BusinessDates;
import vn.ksvh.qc.shared.web.PageResponse;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
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
    private final AppealReviewRepository appealReviewRepository;
    private final UserAccountApi userAccountApi;
    private final InspectionAccess access;
    private final EvidenceApi evidenceApi;
    private final RiskAssessor riskAssessor;
    private final Clock clock;
    private final ApplicationEventPublisher eventPublisher;

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
                    .map(ar -> AppealReviewResponse.from(ar, nameOf(users, ar.getReviewerId())))
                    .toList();

            return FindingResponse.from(f,
                    ins != null ? ins.getCode() : null,
                    r != null ? r.name() : null,
                    c != null ? c.code() : null,
                    c != null ? c.name() : null,
                    nameOf(users, f.getVerifiedBy()),
                    nameOf(users, f.getAppealConcludedBy()),
                    List.of(),
                    arResponses
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

        List<Long> reviewerIds = req.reviewerIds();
        if (reviewerIds == null || reviewerIds.size() < 2 || reviewerIds.size() > 5) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Số lượng người thẩm định khiếu nại phải từ 2 đến 5 người");
        }
        Set<Long> uniqueReviewers = new HashSet<>(reviewerIds);
        if (uniqueReviewers.size() != reviewerIds.size()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Danh sách người thẩm định không được trùng lặp");
        }

        Inspection ins = inspectionOf(f);
        if (uniqueReviewers.contains(ins.getInspectorId())) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Chuyên viên đã chấm lỗi này không được tham gia thẩm định khiếu nại");
        }

        Map<Long, UserSummary> reviewerSummaries = userAccountApi.findSummaries(uniqueReviewers);

        int ksvhCount = 0;
        List<AppealReview> reviews = new ArrayList<>();

        for (Long revId : reviewerIds) {
            UserSummary summary = reviewerSummaries.get(revId);
            if (summary == null || !summary.active()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Người dùng #" + revId + " không tồn tại hoặc đã bị vô hiệu hoá");
            }
            boolean isKsvh = summary.hasRole(RoleCodes.KSVH_LEAD)
                    || summary.hasRole(RoleCodes.KSVH_MANAGER)
                    || summary.hasRole(RoleCodes.KSVH_INSPECTOR);
            boolean isObm = summary.hasRole(RoleCodes.OBM)
                    && orgUnitLookupApi.findRestaurantIdsManagedBy(revId).contains(f.getRestaurantId());

            if (!isKsvh && !isObm) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Người dùng '%s' không thuộc đối tượng thẩm định khiếu nại (KSVH hoặc OBM nhà hàng)".formatted(summary.fullName()));
            }

            if (isKsvh) {
                ksvhCount++;
            }

            AppealReview ar = new AppealReview();
            ar.setFindingId(f.getId());
            ar.setReviewerId(revId);
            ar.setKsvhRep(isKsvh);
            ar.setVerdict(AppealVerdict.PENDING);
            ar.setAppealRound(f.getAppealRound());
            reviews.add(ar);
        }

        if (ksvhCount == 0) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Danh sách thẩm định bắt buộc có ít nhất một đại diện Phòng KSVH");
        }

        appealReviewRepository.saveAll(reviews);

        f.setAppealReason(req.appealReason().trim());
        f.setAppealEvidenceUrls(evidenceApi.requireUploaded(req.appealEvidenceUrls(), user.id()));
        f.setAppealSubmittedAt(clock.instant());
        transition(f, FindingStatus.APPEALED, FindingEventAction.APPEALED, user, f.getAppealReason());
        FindingResponse res = save(f);
        eventPublisher.publishEvent(new FindingAppealedEvent(
                f.getId(), f.getInspectionId(), f.getRestaurantId(), res.restaurantName(), res.criterionName(), req.reviewerIds()
        ));
        return res;
    }

    @Transactional
    public FindingResponse submitAppealReview(Long findingId, AppealReviewRequest req, CurrentUser user) {
        Finding f = load(findingId);
        requireStatus(f, "Lỗi này không ở trạng thái đang khiếu nại", FindingStatus.APPEALED);

        AppealReview review = appealReviewRepository
                .findByFindingIdAndReviewerIdAndAppealRound(f.getId(), user.id(), f.getAppealRound())
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCESS_DENIED,
                        "Bạn không thuộc danh sách người thẩm định khiếu nại này"));

        if (review.getVerdict() != AppealVerdict.PENDING) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Bạn đã gửi ý kiến thẩm định cho khiếu nại này");
        }

        review.setVerdict(req.verdict());
        review.setComment(StringUtils.hasText(req.comment()) ? req.comment().trim() : null);
        review.setReviewedAt(clock.instant());
        appealReviewRepository.save(review);

        String verdictText = req.verdict() == AppealVerdict.FINDING_VALID ? "Lỗi đúng (Giữ lỗi)" : "Lỗi sai (Bỏ lỗi)";
        String note = (review.isKsvhRep() ? "Đại diện KSVH: " : "Thẩm định viên: ") + verdictText
                + (review.getComment() != null ? " - " + review.getComment() : "");
        eventRepository.save(new FindingEvent(f.getId(), FindingEventAction.APPEAL_REVIEWED, f.getStatus(), f.getStatus(), user.id(), note, clock.instant()));

        List<AppealReview> allReviews = appealReviewRepository
                .findByFindingIdAndAppealRoundOrderByCreatedAtAsc(f.getId(), f.getAppealRound());
        boolean allFinished = allReviews.stream().allMatch(r -> r.getVerdict() != AppealVerdict.PENDING);

        if (allFinished) {
            boolean allInvalid = allReviews.stream().allMatch(r -> r.getVerdict() == AppealVerdict.FINDING_INVALID);
            boolean allValid = allReviews.stream().allMatch(r -> r.getVerdict() == AppealVerdict.FINDING_VALID);

            if (allInvalid) {
                f.setAppealConclusion(AppealConclusion.DISMISSED);
                f.setAppealConcludedBy(null);
                transition(f, FindingStatus.DISMISSED, FindingEventAction.APPEAL_DISMISSED, null,
                        "Hội đồng thẩm định đồng thuận bỏ lỗi (khiếu nại đúng)");
                itemRepository.findById(f.getInspectionItemId()).ifPresent(item -> {
                    item.setResult(ItemResult.PASS);
                    String itemNote = "Khiếu nại được chấp thuận: Lỗi đã được huỷ bỏ";
                    item.setComment(item.getComment() != null ? item.getComment() + " (" + itemNote + ")" : itemNote);
                    itemRepository.save(item);
                });
                completeInspectionIfDone(f.getInspectionId());
                FindingResponse finalRes = save(f);
                eventPublisher.publishEvent(new FindingAppealConcludedEvent(
                        f.getId(), f.getInspectionId(), f.getRestaurantId(), finalRes.restaurantName(), finalRes.criterionName(),
                        "DISMISSED", null, "Hội đồng thẩm định"
                ));
                return finalRes;
            } else if (allValid) {
                f.setAppealConclusion(AppealConclusion.UPHELD);
                f.setAppealConcludedBy(null);
                transition(f, FindingStatus.CONFIRMED, FindingEventAction.APPEAL_UPHELD, null,
                        "Hội đồng thẩm định đồng thuận giữ lỗi (khiếu nại sai)");
                addOccurrence(f, OccurrenceSource.APPEAL_UPHELD);
                completeInspectionIfDone(f.getInspectionId());
                FindingResponse finalRes = save(f);
                eventPublisher.publishEvent(new FindingAppealConcludedEvent(
                        f.getId(), f.getInspectionId(), f.getRestaurantId(), finalRes.restaurantName(), finalRes.criterionName(),
                        "UPHELD", null, "Hội đồng thẩm định"
                ));
                return finalRes;
            } else {
                transition(f, FindingStatus.APPEAL_MEETING, FindingEventAction.APPEAL_MEETING, null,
                        "Ý kiến thẩm định không đồng thuận -> Chuyển sang họp thống nhất (Quản lý KSVH chủ trì)");
                FindingResponse finalRes = save(f);
                eventPublisher.publishEvent(new AppealMeetingRequiredEvent(
                        f.getId(), f.getInspectionId(), f.getRestaurantId(), finalRes.restaurantName(), finalRes.criterionName()
                ));
                return finalRes;
            }
        }

        return save(f);
    }

    @Transactional
    public FindingResponse concludeAppeal(Long id, FindingConcludeAppealRequest req, CurrentUser user) {
        Finding f = load(id);
        requireStatus(f, "Chỉ có thể kết luận khiếu nại sau cuộc họp giải quyết bất đồng", FindingStatus.APPEAL_MEETING);
        f.setAppealConclusion(req.conclusion());
        f.setAppealConcludedBy(user.id());

        String note = StringUtils.hasText(req.meetingNotes()) ? req.meetingNotes().trim() : null;
        if (req.conclusion() == AppealConclusion.UPHELD) {
            transition(f, FindingStatus.CONFIRMED, FindingEventAction.APPEAL_UPHELD, user, note);
            addOccurrence(f, OccurrenceSource.APPEAL_UPHELD);
        } else {
            transition(f, FindingStatus.DISMISSED, FindingEventAction.APPEAL_DISMISSED, user, note);
            itemRepository.findById(f.getInspectionItemId()).ifPresent(item -> {
                item.setResult(ItemResult.PASS);
                String itemNote = "Khiếu nại được chấp thuận: Lỗi đã được huỷ bỏ";
                item.setComment(item.getComment() != null ? item.getComment() + " (" + itemNote + ")" : itemNote);
                itemRepository.save(item);
            });
        }
        FindingResponse res = save(f);
        completeInspectionIfDone(f.getInspectionId());
        eventPublisher.publishEvent(new FindingAppealConcludedEvent(
                f.getId(), f.getInspectionId(), f.getRestaurantId(), res.restaurantName(), res.criterionName(),
                req.conclusion().name(), user.id(), user.username()
        ));
        eventPublisher.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                user.id(), user.username(), null,
                "APPEAL_CONCLUDE", "FINDING", "#" + f.getId(),
                "Kết luận họp khiếu nại lỗi #" + f.getId() + " (" + res.criterionName() + "): "
                        + (req.conclusion() == AppealConclusion.UPHELD ? "Giữ lỗi (Vi phạm)" : "Bỏ lỗi (Đạt)"),
                note
        ));
        return res;
    }

    public List<CandidateReviewerResponse> getCandidateReviewers(Long id, CurrentUser user) {
        Finding f = load(id);
        access.requireRead(inspectionOf(f), user);
        Inspection ins = inspectionOf(f);
        Long excludedInspectorId = ins.getInspectorId();

        List<String> targetRoles = List.of(
                RoleCodes.KSVH_LEAD,
                RoleCodes.KSVH_MANAGER,
                RoleCodes.KSVH_INSPECTOR,
                RoleCodes.OBM
        );
        List<UserSummary> candidates = userAccountApi.findActiveUsersByRoleIn(targetRoles);

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
                        return orgUnitLookupApi.findRestaurantIdsManagedBy(u.id()).contains(f.getRestaurantId());
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
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public FindingResponse setRemediationPlan(Long id, FindingRemediationPlanRequest req, CurrentUser user) {
        Finding f = load(id);
        access.requireStoreManager(f.getRestaurantId(), user);
        requireStatus(f, "Chỉ có thể lập kế hoạch khắc phục cho lỗi đã xác nhận", FindingStatus.CONFIRMED);

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
        String evidence = evidenceApi.requireUploaded(req.remediationEvidenceUrls(), user.id());
        if (evidence == null) {
            throw new BusinessException(ErrorCode.EVIDENCE_INVALID, "Bắt buộc có ảnh/video bằng chứng khắc phục");
        }
        f.setRemediationEvidenceUrls(evidence);
        f.setRemediationSubmittedAt(clock.instant());
        transition(f, FindingStatus.PENDING_VERIFICATION, FindingEventAction.REMEDIATION_SUBMITTED, user, null);
        FindingResponse res = save(f);
        Inspection ins = inspectionOf(f);
        eventPublisher.publishEvent(new RemediationSubmittedEvent(
                f.getId(), f.getInspectionId(), f.getRestaurantId(), res.restaurantName(), res.criterionName(), ins.getInspectorId()
        ));
        return res;
    }

    @Transactional
    public FindingResponse verify(Long id, FindingVerifyRequest req, CurrentUser user) {
        Finding f = load(id);
        access.requireVerifier(inspectionOf(f), user);
        requireStatus(f, "Lỗi này chưa gửi bằng chứng khắc phục để nghiệm thu", FindingStatus.PENDING_VERIFICATION);
        return verifyInternal(f, Boolean.TRUE.equals(req.passed()), req.comment(), user.id(), user.username());
    }

    @Transactional
    public FindingResponse verifyInternal(Finding f, boolean passed, String comment, Long actorId, String actorUsername) {
        f.setVerifiedBy(actorId);
        f.setVerifiedAt(clock.instant());
        f.setVerificationComment(StringUtils.hasText(comment) ? comment.trim() : null);

        if (passed) {
            transitionWithActorId(f, FindingStatus.CLOSED, FindingEventAction.VERIFY_PASSED, actorId, f.getVerificationComment());
        } else {
            reassess(f);
            f.setDeadlineDate(BusinessDates.today(clock).plusDays(f.getRemediationDays()));
            transitionWithActorId(f, FindingStatus.CONFIRMED, FindingEventAction.VERIFY_FAILED, actorId, f.getVerificationComment());
            addOccurrence(f, OccurrenceSource.VERIFY_FAILED);
        }
        FindingResponse res = save(f);
        completeInspectionIfDone(f.getInspectionId());
        eventPublisher.publishEvent(new FindingVerifiedEvent(
                f.getId(), f.getInspectionId(), f.getRestaurantId(), res.restaurantName(), res.criterionName(),
                passed, actorId, actorUsername
        ));
        return res;
    }

    public List<CandidateFindingResponse> listCandidatesForVerification(Long restaurantId, CurrentUser user) {
        List<Finding> list = findingRepository.findByRestaurantIdAndStatusIn(restaurantId,
                List.of(FindingStatus.PENDING_VERIFICATION, FindingStatus.REMEDIATING));
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

    static final Set<FindingStatus> OVERDUE_STATUSES =
            EnumSet.of(FindingStatus.CONFIRMED, FindingStatus.REMEDIATING, FindingStatus.PENDING_VERIFICATION);

    @Transactional
    public int markOverdueFindings() {
        LocalDate today = BusinessDates.today(clock);
        List<Finding> overdue = findingRepository.findByStatusInAndDeadlineDateBefore(OVERDUE_STATUSES, today);
        Set<Long> restIds = overdue.stream().map(Finding::getRestaurantId).collect(Collectors.toSet());
        Map<Long, OrgUnitRef> rests = orgUnitLookupApi.findRefs(restIds);
        Set<Long> itemIds = overdue.stream().map(Finding::getInspectionItemId).collect(Collectors.toSet());
        Map<Long, InspectionItem> items = itemRepository.findAllById(itemIds).stream()
                .collect(Collectors.toMap(InspectionItem::getId, Function.identity()));

        for (Finding f : overdue) {
            reassess(f);
            f.setDeadlineDate(today.plusDays(f.getRemediationDays()));
            transition(f, FindingStatus.CONFIRMED, FindingEventAction.OVERDUE, null,
                    "Quá hạn khắc phục -> Tự động +1 tần suất vi phạm, mở vòng khắc phục mới");
            addOccurrence(f, OccurrenceSource.OVERDUE);
            OrgUnitRef rest = rests.get(f.getRestaurantId());
            String resName = rest != null ? rest.name() : ("#" + f.getRestaurantId());
            InspectionItem it = items.get(f.getInspectionItemId());
            String critName = it != null ? it.getCriterionName() : ("Tiêu chí #" + f.getCriterionId());
            eventPublisher.publishEvent(new FindingOverdueEvent(
                    f.getId(), f.getRestaurantId(), resName, critName, f.getCalculatedScore()
            ));
        }
        findingRepository.flush();
        return overdue.size();
    }

    @Transactional
    public int sendDueReminders() {
        LocalDate tomorrow = BusinessDates.today(clock).plusDays(1);
        List<Finding> dueTomorrow = findingRepository.findByStatusInAndDeadlineDate(OVERDUE_STATUSES, tomorrow);
        Set<Long> restIds = dueTomorrow.stream().map(Finding::getRestaurantId).collect(Collectors.toSet());
        Map<Long, OrgUnitRef> rests = orgUnitLookupApi.findRefs(restIds);
        Set<Long> itemIds = dueTomorrow.stream().map(Finding::getInspectionItemId).collect(Collectors.toSet());
        Map<Long, InspectionItem> items = itemRepository.findAllById(itemIds).stream()
                .collect(Collectors.toMap(InspectionItem::getId, Function.identity()));

        for (Finding f : dueTomorrow) {
            OrgUnitRef rest = rests.get(f.getRestaurantId());
            String resName = rest != null ? rest.name() : ("#" + f.getRestaurantId());
            InspectionItem it = items.get(f.getInspectionItemId());
            String critName = it != null ? it.getCriterionName() : ("Tiêu chí #" + f.getCriterionId());
            eventPublisher.publishEvent(new FindingReminderDueEvent(
                    f.getId(), f.getRestaurantId(), resName, critName, f.getDeadlineDate()
            ));
        }
        return dueTomorrow.size();
    }

    private void transition(Finding f, FindingStatus to, FindingEventAction action, CurrentUser user, String note) {
        FindingStatus from = f.getStatus();
        f.setStatus(to);
        eventRepository.save(new FindingEvent(f.getId(), action, from, to, user != null ? user.id() : null, note, clock.instant()));
    }

    private void transitionWithActorId(Finding f, FindingStatus to, FindingEventAction action, Long actorId, String note) {
        FindingStatus from = f.getStatus();
        f.setStatus(to);
        eventRepository.save(new FindingEvent(f.getId(), action, from, to, actorId, note, clock.instant()));
    }

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
        List<AppealReview> reviews = appealReviewRepository
                .findByFindingIdAndAppealRoundOrderByCreatedAtAsc(f.getId(), f.getAppealRound());

        var users = userAccountApi.findSummaries(Stream.concat(
                        Stream.concat(
                                Stream.of(f.getVerifiedBy(), f.getAppealConcludedBy()),
                                events.stream().map(FindingEvent::getActorId)
                        ),
                        reviews.stream().map(AppealReview::getReviewerId)
                ).filter(Objects::nonNull).distinct().toList());

        List<AppealReviewResponse> appealReviews = reviews.stream()
                .map(r -> AppealReviewResponse.from(r, nameOf(users, r.getReviewerId())))
                .toList();

        return FindingResponse.from(f,
                ins != null ? ins.getCode() : null,
                rest != null ? rest.name() : null,
                crit != null ? crit.code() : null,
                crit != null ? crit.name() : null,
                nameOf(users, f.getVerifiedBy()),
                nameOf(users, f.getAppealConcludedBy()),
                events.stream().map(e -> FindingEventResponse.from(e, nameOf(users, e.getActorId()))).toList(),
                appealReviews
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

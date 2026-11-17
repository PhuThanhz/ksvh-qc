package vn.ksvh.qc.inspection.service.finding;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.inspection.api.event.AppealMeetingRequiredEvent;
import vn.ksvh.qc.inspection.api.event.FindingAppealConcludedEvent;
import vn.ksvh.qc.inspection.api.event.FindingAppealedEvent;
import vn.ksvh.qc.inspection.config.InspectionProperties;
import vn.ksvh.qc.inspection.domain.*;
import vn.ksvh.qc.inspection.dto.AppealReviewRequest;
import vn.ksvh.qc.inspection.dto.FindingAppealRequest;
import vn.ksvh.qc.inspection.dto.FindingConcludeAppealRequest;
import vn.ksvh.qc.inspection.dto.FindingResponse;
import vn.ksvh.qc.inspection.service.InspectionAccess;
import vn.ksvh.qc.media.api.EvidenceApi;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.util.BusinessDates;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FindingResponseService {

    private final FindingLifecycle lifecycle;
    private final AppealReviewRepository appealReviewRepository;
    private final FindingEventRepository eventRepository;
    private final OrgUnitLookupApi orgUnitLookupApi;
    private final UserAccountApi userAccountApi;
    private final InspectionAccess access;
    private final EvidenceApi evidenceApi;
    private final Clock clock;
    private final ApplicationEventPublisher eventPublisher;
    private final InspectionProperties properties;

    private static final DateTimeFormatter DATE_VN = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Transactional
    public FindingResponse confirm(Long id, CurrentUser user) {
        Finding f = lifecycle.load(id);
        access.requireStoreManager(f.getRestaurantId(), user);
        lifecycle.requireStatus(f, "Lỗi này không ở trạng thái chờ xác nhận", FindingStatus.OPEN);
        lifecycle.transition(f, FindingStatus.CONFIRMED, FindingEventAction.CONFIRMED, user, null);
        lifecycle.addOccurrence(f, OccurrenceSource.CONFIRMED);
        return lifecycle.save(f);
    }

    @Transactional
    public int batchConfirm(List<Long> ids, String note, CurrentUser user) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }
        int count = 0;
        for (Long id : ids) {
            Finding f = lifecycle.load(id);
            access.requireStoreManager(f.getRestaurantId(), user);
            if (f.getStatus() == FindingStatus.OPEN) {
                lifecycle.transition(f, FindingStatus.CONFIRMED, FindingEventAction.CONFIRMED, user, note);
                lifecycle.addOccurrence(f, OccurrenceSource.CONFIRMED);
                lifecycle.save(f);
                count++;
            }
        }
        return count;
    }

    @Transactional
    public FindingResponse appeal(Long id, FindingAppealRequest req, CurrentUser user) {
        Finding f = lifecycle.load(id);
        access.requireStoreManager(f.getRestaurantId(), user);
        lifecycle.requireStatus(f, "Lỗi này không ở trạng thái có thể khiếu nại", FindingStatus.OPEN);

        List<Long> reviewerIds = req.reviewerIds();
        int minRev = properties.minAppealReviewers();
        int maxRev = properties.maxAppealReviewers();
        if (reviewerIds == null || reviewerIds.size() < minRev || reviewerIds.size() > maxRev) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Số lượng người thẩm định khiếu nại phải từ %d đến %d người".formatted(minRev, maxRev));
        }
        Set<Long> uniqueReviewers = new HashSet<>(reviewerIds);
        if (uniqueReviewers.size() != reviewerIds.size()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Danh sách người thẩm định không được trùng lặp");
        }

        Inspection ins = lifecycle.inspectionOf(f);
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
        lifecycle.transition(f, FindingStatus.APPEALED, FindingEventAction.APPEALED, user, f.getAppealReason());
        FindingResponse res = lifecycle.save(f);
        eventPublisher.publishEvent(new FindingAppealedEvent(
                f.getId(), f.getInspectionId(), f.getRestaurantId(), res.restaurantName(), res.criterionName(), req.reviewerIds()
        ));
        return res;
    }

    @Transactional
    public FindingResponse submitAppealReview(Long findingId, AppealReviewRequest req, CurrentUser user) {
        Finding f = lifecycle.load(findingId);
        lifecycle.requireStatus(f, "Lỗi này không ở trạng thái đang khiếu nại", FindingStatus.APPEALED);

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
                lifecycle.transition(f, FindingStatus.DISMISSED, FindingEventAction.APPEAL_DISMISSED, null,
                        "Hội đồng thẩm định đồng thuận bỏ lỗi (khiếu nại đúng)");
                lifecycle.completeInspectionIfDone(f.getInspectionId());
                FindingResponse finalRes = lifecycle.save(f);
                eventPublisher.publishEvent(new FindingAppealConcludedEvent(
                        f.getId(), f.getInspectionId(), f.getRestaurantId(), finalRes.restaurantName(), finalRes.criterionName(),
                        "DISMISSED", null, "Hội đồng thẩm định"
                ));
                return finalRes;
            } else if (allValid) {
                f.setAppealConclusion(AppealConclusion.UPHELD);
                f.setAppealConcludedBy(null);
                LocalDate today = BusinessDates.today(clock);
                LocalDate newDeadline = today.plusDays(f.getRemediationDays());
                f.setDeadlineDate(newDeadline);
                String deadlineNote = "Hạn khắc phục mới: " + newDeadline.format(DATE_VN);
                lifecycle.transition(f, FindingStatus.CONFIRMED, FindingEventAction.APPEAL_UPHELD, null,
                        "Hội đồng thẩm định đồng thuận giữ lỗi (khiếu nại sai). " + deadlineNote);
                lifecycle.addOccurrence(f, OccurrenceSource.APPEAL_UPHELD);
                lifecycle.completeInspectionIfDone(f.getInspectionId());
                FindingResponse finalRes = lifecycle.save(f);
                eventPublisher.publishEvent(new FindingAppealConcludedEvent(
                        f.getId(), f.getInspectionId(), f.getRestaurantId(), finalRes.restaurantName(), finalRes.criterionName(),
                        "UPHELD", null, "Hội đồng thẩm định"
                ));
                return finalRes;
            } else {
                lifecycle.transition(f, FindingStatus.APPEAL_MEETING, FindingEventAction.APPEAL_MEETING, null,
                        "Ý kiến thẩm định không đồng thuận -> Chuyển sang họp thống nhất (Quản lý KSVH chủ trì)");
                FindingResponse finalRes = lifecycle.save(f);
                eventPublisher.publishEvent(new AppealMeetingRequiredEvent(
                        f.getId(), f.getInspectionId(), f.getRestaurantId(), finalRes.restaurantName(), finalRes.criterionName()
                ));
                return finalRes;
            }
        }

        return lifecycle.save(f);
    }

    @Transactional
    public FindingResponse concludeAppeal(Long id, FindingConcludeAppealRequest req, CurrentUser user) {
        Finding f = lifecycle.load(id);
        lifecycle.requireStatus(f, "Chỉ có thể kết luận khiếu nại sau cuộc họp giải quyết bất đồng", FindingStatus.APPEAL_MEETING);
        f.setAppealConclusion(req.conclusion());
        f.setAppealConcludedBy(user.id());

        String note = StringUtils.hasText(req.meetingNotes()) ? req.meetingNotes().trim() : null;
        if (req.conclusion() == AppealConclusion.UPHELD) {
            LocalDate today = BusinessDates.today(clock);
            LocalDate newDeadline = today.plusDays(f.getRemediationDays());
            f.setDeadlineDate(newDeadline);
            String deadlineNote = "Hạn khắc phục mới: " + newDeadline.format(DATE_VN);
            String fullNote = (note != null ? note + ". " : "") + deadlineNote;
            lifecycle.transition(f, FindingStatus.CONFIRMED, FindingEventAction.APPEAL_UPHELD, user, fullNote);
            lifecycle.addOccurrence(f, OccurrenceSource.APPEAL_UPHELD);
        } else {
            lifecycle.transition(f, FindingStatus.DISMISSED, FindingEventAction.APPEAL_DISMISSED, user, note);
        }
        FindingResponse res = lifecycle.save(f);
        lifecycle.completeInspectionIfDone(f.getInspectionId());
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
}

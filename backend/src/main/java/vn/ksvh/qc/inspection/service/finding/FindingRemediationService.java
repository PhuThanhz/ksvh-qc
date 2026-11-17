package vn.ksvh.qc.inspection.service.finding;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.inspection.api.event.FindingOverdueEvent;
import vn.ksvh.qc.inspection.api.event.FindingReminderDueEvent;
import vn.ksvh.qc.inspection.api.event.FindingVerifiedEvent;
import vn.ksvh.qc.inspection.api.event.RemediationSubmittedEvent;
import vn.ksvh.qc.inspection.domain.*;
import vn.ksvh.qc.inspection.dto.BatchFindingVerifyRequest;
import vn.ksvh.qc.inspection.dto.BatchRemediationPlanRequest;
import vn.ksvh.qc.inspection.dto.FindingRemediationPlanRequest;
import vn.ksvh.qc.inspection.dto.FindingResponse;
import vn.ksvh.qc.inspection.dto.FindingSubmitRemediationRequest;
import vn.ksvh.qc.inspection.dto.FindingVerifyRequest;
import vn.ksvh.qc.inspection.service.InspectionAccess;
import vn.ksvh.qc.media.api.EvidenceApi;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.util.BusinessDates;

import java.time.Clock;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FindingRemediationService {

    public static final Set<FindingStatus> OVERDUE_STATUSES =
            EnumSet.of(FindingStatus.CONFIRMED, FindingStatus.REMEDIATING, FindingStatus.PENDING_VERIFICATION);

    private final FindingLifecycle lifecycle;
    private final FindingRepository findingRepository;
    private final InspectionRepository inspectionRepository;
    private final InspectionItemRepository itemRepository;
    private final OrgUnitLookupApi orgUnitLookupApi;
    private final InspectionAccess access;
    private final EvidenceApi evidenceApi;
    private final Clock clock;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public FindingResponse setRemediationPlan(Long id, FindingRemediationPlanRequest req, CurrentUser user) {
        Finding f = lifecycle.load(id);
        access.requireStoreManager(f.getRestaurantId(), user);
        lifecycle.requireStatus(f, "Chỉ có thể lập kế hoạch khắc phục cho lỗi đã xác nhận", FindingStatus.CONFIRMED);

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
        lifecycle.transition(f, FindingStatus.REMEDIATING, FindingEventAction.REMEDIATION_PLANNED, user,
                "Hẹn hoàn thành " + target + ": " + f.getRemediationPlan());
        return lifecycle.save(f);
    }

    @Transactional
    public int batchSetRemediationPlan(BatchRemediationPlanRequest req, CurrentUser user) {
        if (req.findingIds() == null || req.findingIds().isEmpty()) {
            return 0;
        }
        int count = 0;
        var subReq = new FindingRemediationPlanRequest(req.remediationPlan(), req.remediationDeadline());
        for (Long id : req.findingIds()) {
            setRemediationPlan(id, subReq, user);
            count++;
        }
        return count;
    }

    @Transactional
    public FindingResponse submitRemediation(Long id, FindingSubmitRemediationRequest req, CurrentUser user) {
        Finding f = lifecycle.load(id);
        access.requireStoreManager(f.getRestaurantId(), user);
        lifecycle.requireStatus(f, "Cần lập kế hoạch khắc phục trước khi gửi bằng chứng", FindingStatus.REMEDIATING);
        String evidence = evidenceApi.requireUploaded(req.remediationEvidenceUrls(), user.id());
        if (evidence == null) {
            throw new BusinessException(ErrorCode.EVIDENCE_INVALID, "Bắt buộc có ảnh/video bằng chứng khắc phục");
        }
        f.setRemediationEvidenceUrls(evidence);
        f.setRemediationSubmittedAt(clock.instant());
        lifecycle.transition(f, FindingStatus.PENDING_VERIFICATION, FindingEventAction.REMEDIATION_SUBMITTED, user, null);
        FindingResponse res = lifecycle.save(f);
        Inspection ins = lifecycle.inspectionOf(f);
        eventPublisher.publishEvent(new RemediationSubmittedEvent(
                f.getId(), f.getInspectionId(), f.getRestaurantId(), res.restaurantName(), res.criterionName(), ins.getInspectorId()
        ));
        return res;
    }

    @Transactional
    public FindingResponse verify(Long id, FindingVerifyRequest req, CurrentUser user) {
        Finding f = lifecycle.load(id);
        access.requireVerifier(lifecycle.inspectionOf(f), user);
        lifecycle.requireStatus(f, "Lỗi này chưa gửi bằng chứng khắc phục để nghiệm thu", FindingStatus.PENDING_VERIFICATION);
        return verifyInternal(f, Boolean.TRUE.equals(req.passed()), req.comment(), user.id(), user.username());
    }

    @Transactional
    public int batchVerify(BatchFindingVerifyRequest req, CurrentUser user) {
        if (req.items() == null || req.items().isEmpty()) {
            return 0;
        }
        int count = 0;
        for (var item : req.items()) {
            verify(item.findingId(), new FindingVerifyRequest(item.passed(), item.comment()), user);
            count++;
        }
        return count;
    }

    @Transactional
    public FindingResponse verifyInternal(Finding f, boolean passed, String comment, Long actorId, String actorUsername) {
        f.setVerifiedBy(actorId);
        f.setVerifiedAt(clock.instant());
        f.setVerificationComment(StringUtils.hasText(comment) ? comment.trim() : null);

        if (passed) {
            lifecycle.transitionWithActorId(f, FindingStatus.CLOSED, FindingEventAction.VERIFY_PASSED, actorId, f.getVerificationComment());
        } else {
            lifecycle.reassess(f);
            f.setDeadlineDate(BusinessDates.today(clock).plusDays(f.getRemediationDays()));
            lifecycle.transitionWithActorId(f, FindingStatus.CONFIRMED, FindingEventAction.VERIFY_FAILED, actorId, f.getVerificationComment());
            lifecycle.addOccurrence(f, OccurrenceSource.VERIFY_FAILED);
        }
        FindingResponse res = lifecycle.save(f);
        lifecycle.completeInspectionIfDone(f.getInspectionId());
        eventPublisher.publishEvent(new FindingVerifiedEvent(
                f.getId(), f.getInspectionId(), f.getRestaurantId(), res.restaurantName(), res.criterionName(),
                passed, actorId, actorUsername
        ));
        return res;
    }

    @Transactional
    public int markOverdueFindings() {
        LocalDate today = BusinessDates.today(clock);
        List<Finding> overdue = findingRepository.findByStatusInAndDeadlineDateBefore(OVERDUE_STATUSES, today);
        Set<Long> restIds = overdue.stream().map(Finding::getRestaurantId).collect(Collectors.toSet());
        Map<Long, OrgUnitRef> rests = orgUnitLookupApi.findRefs(restIds);
        Set<Long> itemIds = overdue.stream().map(Finding::getInspectionItemId).collect(Collectors.toSet());
        Map<Long, InspectionItem> items = itemRepository.findAllById(itemIds).stream()
                .collect(Collectors.toMap(InspectionItem::getId, Function.identity()));

        int processed = 0;
        for (Finding f : overdue) {
            try {
                lifecycle.reassess(f);
                f.setDeadlineDate(today.plusDays(f.getRemediationDays()));
                lifecycle.transition(f, FindingStatus.CONFIRMED, FindingEventAction.OVERDUE, null,
                        "Quá hạn khắc phục -> Tự động +1 tần suất vi phạm, mở vòng khắc phục mới");
                lifecycle.addOccurrence(f, OccurrenceSource.OVERDUE);
                OrgUnitRef rest = rests.get(f.getRestaurantId());
                String resName = rest != null ? rest.name() : ("#" + f.getRestaurantId());
                InspectionItem it = items.get(f.getInspectionItemId());
                String critName = it != null ? it.getCriterionName() : ("Tiêu chí #" + f.getCriterionId());
                eventPublisher.publishEvent(new FindingOverdueEvent(
                        f.getId(), f.getRestaurantId(), resName, critName, f.getCalculatedScore()
                ));
                processed++;
            } catch (Exception e) {
                log.error("Lỗi khi xử lý quá hạn lỗi vi phạm #{}: {}", f.getId(), e.getMessage(), e);
            }
        }
        findingRepository.flush();
        return processed;
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

        int sent = 0;
        for (Finding f : dueTomorrow) {
            try {
                OrgUnitRef rest = rests.get(f.getRestaurantId());
                String resName = rest != null ? rest.name() : ("#" + f.getRestaurantId());
                InspectionItem it = items.get(f.getInspectionItemId());
                String critName = it != null ? it.getCriterionName() : ("Tiêu chí #" + f.getCriterionId());
                eventPublisher.publishEvent(new FindingReminderDueEvent(
                        f.getId(), f.getRestaurantId(), resName, critName, f.getDeadlineDate()
                ));
                sent++;
            } catch (Exception e) {
                log.error("Lỗi khi gửi nhắc hẹn lỗi #{}: {}", f.getId(), e.getMessage(), e);
            }
        }
        return sent;
    }
}

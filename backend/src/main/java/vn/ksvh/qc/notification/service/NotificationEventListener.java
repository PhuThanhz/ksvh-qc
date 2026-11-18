package vn.ksvh.qc.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.inspection.api.event.*;
import vn.ksvh.qc.notification.domain.NotificationType;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final UserAccountApi userAccountApi;
    private final OrgUnitLookupApi orgUnitLookupApi;

    @EventListener
    @Transactional
    public void onPlanSubmitted(PlanSubmittedEvent event) {
        log.info("Handling PlanSubmittedEvent: planId={}", event.planId());
        List<Long> managers = getActiveUserIdsWithRoles(List.of(RoleCodes.KSVH_MANAGER, RoleCodes.KSVH_LEAD));
        notificationService.createBatch(
                managers,
                NotificationType.PLAN_SUBMITTED,
                "Kế hoạch kiểm tra mới chờ duyệt",
                "Kế hoạch " + event.planCode() + " - " + event.title() + " đã được gửi duyệt bởi " + event.createdByName(),
                "/admin/inspections/plans"
        );
    }

    @EventListener
    @Transactional
    public void onPlanApproved(PlanApprovedEvent event) {
        log.info("Handling PlanApprovedEvent: planId={}", event.planId());
        if (event.createdBy() != null) {
            notificationService.create(
                    event.createdBy(),
                    NotificationType.PLAN_APPROVED,
                    "Kế hoạch kiểm tra đã được phê duyệt",
                    "Kế hoạch " + event.planCode() + " đã được phê duyệt bởi " + event.approverName()
                            + ". " + event.createdInspectionCount() + " phiếu kiểm tra định kỳ đã được khởi tạo.",
                    "/admin/inspections/plans"
            );
        }
        if (event.assignedInspectorIds() != null && !event.assignedInspectorIds().isEmpty()) {
            Set<Long> inspectors = event.assignedInspectorIds().stream()
                    .filter(id -> !Objects.equals(id, event.createdBy()))
                    .collect(Collectors.toSet());
            notificationService.createBatch(
                    inspectors,
                    NotificationType.INSPECTION_ASSIGNED,
                    "Bạn được phân công kiểm tra theo kế hoạch",
                    "Kế hoạch " + event.planCode() + " đã được duyệt. Bạn có phiếu kiểm tra mới được phân công.",
                    "/admin/inspections"
            );
        }
    }

    @EventListener
    @Transactional
    public void onPlanRejected(PlanRejectedEvent event) {
        log.info("Handling PlanRejectedEvent: planId={}", event.planId());
        if (event.createdBy() != null) {
            notificationService.create(
                    event.createdBy(),
                    NotificationType.PLAN_REJECTED,
                    "Kế hoạch kiểm tra bị từ chối",
                    "Kế hoạch " + event.planCode() + " bị từ chối bởi " + event.approverName() + ". Lý do: " + event.reason(),
                    "/admin/inspections/plans"
            );
        }
    }

    @EventListener
    @Transactional
    public void onInspectionAssigned(InspectionAssignedEvent event) {
        log.info("Handling InspectionAssignedEvent: insId={}", event.inspectionId());
        notificationService.create(
                event.inspectorId(),
                NotificationType.INSPECTION_ASSIGNED,
                "Bạn được phân công phiếu kiểm tra mới",
                "Phiếu " + event.inspectionCode() + " tại " + event.restaurantName() + " (" + event.inspectionType() + ")",
                "/admin/inspections"
        );
    }

    @EventListener
    @Transactional
    public void onInspectionSubmitted(InspectionSubmittedEvent event) {
        log.info("Handling InspectionSubmittedEvent: insId={}, findingsCount={}", event.inspectionId(), event.findingsCount());
        OrgUnitRef res = orgUnitLookupApi.findRefs(List.of(event.restaurantId())).get(event.restaurantId());
        if (res == null) return;

        List<Long> targets = new ArrayList<>();
        if (res.storeManagerUserId() != null) targets.add(res.storeManagerUserId());
        if (res.obmUserId() != null) targets.add(res.obmUserId());

        if (event.findingsCount() > 0) {
            notificationService.createBatch(
                    targets,
                    NotificationType.INSPECTION_SUBMITTED,
                    "Biên bản kiểm tra ghi nhận " + event.findingsCount() + " lỗi vi phạm",
                    "Phiếu " + event.inspectionCode() + " tại " + event.restaurantName()
                            + " ghi nhận " + event.findingsCount() + " lỗi. Vui lòng xác nhận hoặc khiếu nại trong vòng 24h.",
                    "/admin/inspections/findings?inspectionId=" + event.inspectionId()
            );
        } else {
            notificationService.createBatch(
                    targets,
                    NotificationType.INSPECTION_SUBMITTED,
                    "Phiếu kiểm tra đạt chuẩn (không có lỗi)",
                    "Phiếu " + event.inspectionCode() + " tại " + event.restaurantName()
                            + " đã hoàn thành, không phát hiện lỗi vi phạm.",
                    "/admin/inspections"
            );
        }
    }

    @EventListener
    @Transactional
    public void onFindingAppealed(FindingAppealedEvent event) {
        log.info("Handling FindingAppealedEvent: findingId={}", event.findingId());
        notificationService.createBatch(
                event.reviewerIds(),
                NotificationType.FINDING_APPEALED,
                "Yêu cầu thẩm định khiếu nại lỗi vi phạm",
                "Nhà hàng " + event.restaurantName() + " khiếu nại lỗi " + event.criterionName()
                        + " (#" + event.findingId() + "). Vui lòng thẩm định.",
                "/admin/inspections/findings?status=PENDING_REVIEW"
        );
    }

    @EventListener
    @Transactional
    public void onAppealMeetingRequired(AppealMeetingRequiredEvent event) {
        log.info("Handling AppealMeetingRequiredEvent: findingId={}", event.findingId());
        List<Long> managers = getActiveUserIdsWithRoles(List.of(RoleCodes.KSVH_MANAGER, RoleCodes.KSVH_LEAD));
        notificationService.createBatch(
                managers,
                NotificationType.APPEAL_MEETING_REQUIRED,
                "Cần tổ chức họp giải quyết bất đồng khiếu nại",
                "Hội đồng thẩm định bất đồng ý kiến về lỗi #" + event.findingId()
                        + " (" + event.criterionName() + ") tại " + event.restaurantName()
                        + ". Cần Quản lý KSVH chủ trì họp.",
                "/admin/inspections/findings?status=APPEAL_MEETING"
        );
    }

    @EventListener
    @Transactional
    public void onFindingAppealConcluded(FindingAppealConcludedEvent event) {
        log.info("Handling FindingAppealConcludedEvent: findingId={}", event.findingId());
        OrgUnitRef res = orgUnitLookupApi.findRefs(List.of(event.restaurantId())).get(event.restaurantId());
        if (res == null || res.storeManagerUserId() == null) return;

        boolean upheld = "UPHELD".equalsIgnoreCase(event.conclusion());
        notificationService.create(
                res.storeManagerUserId(),
                NotificationType.FINDING_APPEAL_CONCLUDED,
                "Kết quả thẩm định khiếu nại lỗi #" + event.findingId(),
                "Khiếu nại lỗi " + event.criterionName() + " đã có kết luận: "
                        + (upheld ? "Giữ nguyên lỗi (Bác khiếu nại)" : "Chấp nhận khiếu nại (Huỷ bỏ lỗi)"),
                "/admin/inspections/findings"
        );
    }

    @EventListener
    @Transactional
    public void onRemediationSubmitted(RemediationSubmittedEvent event) {
        log.info("Handling RemediationSubmittedEvent: findingId={}", event.findingId());
        notificationService.create(
                event.inspectorId(),
                NotificationType.REMEDIATION_SUBMITTED,
                "Nhà hàng đã nộp bằng chứng khắc phục",
                "Nhà hàng " + event.restaurantName() + " đã nộp bằng chứng khắc phục lỗi #" + event.findingId()
                        + " (" + event.criterionName() + "). Vui lòng nghiệm thu.",
                "/admin/inspections/findings"
        );
    }

    @EventListener
    @Transactional
    public void onFindingVerified(FindingVerifiedEvent event) {
        log.info("Handling FindingVerifiedEvent: findingId={}", event.findingId());
        OrgUnitRef res = orgUnitLookupApi.findRefs(List.of(event.restaurantId())).get(event.restaurantId());
        if (res == null || res.storeManagerUserId() == null) return;

        notificationService.create(
                res.storeManagerUserId(),
                NotificationType.FINDING_VERIFIED,
                "Kết quả nghiệm thu khắc phục lỗi #" + event.findingId(),
                "Lỗi " + event.criterionName() + " tại " + event.restaurantName() + " đã được chuyên viên nghiệm thu: "
                        + (event.passed() ? "ĐẠT YÊU CẦU (Đã đóng lỗi)" : "CHƯA ĐẠT (Tăng 1 lần tần suất vi phạm)"),
                "/admin/inspections/findings"
        );
    }

    @EventListener
    @Transactional
    public void onFindingM4Alert(FindingM4AlertEvent event) {
        log.info("Handling FindingM4AlertEvent: findingId={}", event.findingId());
        List<Long> alertUsers = getActiveUserIdsWithRoles(List.of(RoleCodes.EXECUTIVE, RoleCodes.KSVH_MANAGER));
        notificationService.createBatch(
                alertUsers,
                NotificationType.FINDING_M4_ALERT,
                "CẢNH BÁO: Phát hiện lỗi rủi ro nghiêm trọng M4",
                "Lỗi #" + event.findingId() + " (" + event.criterionName() + ") tại " + event.restaurantName()
                        + " đạt mức rủi ro nghiêm trọng M4 (" + event.calculatedScore() + " điểm). Hạn khắc phục: 1 ngày.",
                "/admin/inspections/findings"
        );
    }

    @EventListener
    @Transactional
    public void onFindingOverdue(FindingOverdueEvent event) {
        log.info("Handling FindingOverdueEvent: findingId={}", event.findingId());
        OrgUnitRef res = orgUnitLookupApi.findRefs(List.of(event.restaurantId())).get(event.restaurantId());
        if (res == null) return;

        List<Long> targets = new ArrayList<>();
        if (res.storeManagerUserId() != null) targets.add(res.storeManagerUserId());
        if (res.obmUserId() != null) targets.add(res.obmUserId());

        notificationService.createBatch(
                targets,
                NotificationType.FINDING_OVERDUE,
                "Quá hạn khắc phục: Lỗi #" + event.findingId() + " đã bị +1 tần suất",
                "Lỗi " + event.criterionName() + " tại " + event.restaurantName()
                        + " đã quá hạn khắc phục. Hệ thống đã tự động ghi nhận +1 tần suất vi phạm (điểm mới: "
                        + event.newScore() + " điểm).",
                "/admin/inspections/findings"
        );
    }

    @EventListener
    @Transactional
    public void onFindingReminderDue(FindingReminderDueEvent event) {
        log.info("Handling FindingReminderDueEvent: findingId={}", event.findingId());
        OrgUnitRef res = orgUnitLookupApi.findRefs(List.of(event.restaurantId())).get(event.restaurantId());
        if (res == null) return;

        List<Long> targets = new ArrayList<>();
        if (res.storeManagerUserId() != null) targets.add(res.storeManagerUserId());
        if (res.obmUserId() != null) targets.add(res.obmUserId());

        notificationService.createBatch(
                targets,
                NotificationType.FINDING_REMINDER_DUE,
                "Nhắc nhở: Lỗi #" + event.findingId() + " sắp đến hạn khắc phục",
                "Lỗi " + event.criterionName() + " tại " + event.restaurantName()
                        + " sẽ hết hạn khắc phục vào ngày " + event.deadlineDate() + ". Vui lòng hoàn thành khắc phục đúng hạn.",
                "/admin/inspections/findings"
        );
    }

    private List<Long> getActiveUserIdsWithRoles(List<String> roleCodes) {
        return userAccountApi.findActiveUsersByRoleIn(roleCodes).stream()
                .map(UserSummary::id)
                .toList();
    }
}

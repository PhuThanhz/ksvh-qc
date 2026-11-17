package vn.ksvh.qc.report.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Schema(description = "Hàng chờ duyệt dành cho Quản lý KSVH")
public record ApprovalQueueResponse(
        List<PendingPlanItem> pendingPlans,
        List<AppealMeetingItem> appealMeetings
) {
    public record PendingPlanItem(
            Long id,
            String planCode,
            String title,
            LocalDate startDate,
            LocalDate endDate,
            int restaurantCount,
            Instant createdAt
    ) {}

    public record AppealMeetingItem(
            Long id,
            Long inspectionId,
            String inspectionCode,
            Long restaurantId,
            String restaurantName,
            String riskLevelCode,
            String appealReason,
            Instant updatedAt
    ) {}
}

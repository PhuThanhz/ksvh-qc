package vn.ksvh.qc.inspection.api.event;

public record PlanRejectedEvent(
        Long planId,
        String planCode,
        String title,
        Long createdBy,
        Long approverId,
        String approverName,
        String reason
) {
}

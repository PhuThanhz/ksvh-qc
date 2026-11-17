package vn.ksvh.qc.inspection.api.event;

public record PlanSubmittedEvent(
        Long planId,
        String planCode,
        String title,
        Long createdBy,
        String createdByName
) {
}

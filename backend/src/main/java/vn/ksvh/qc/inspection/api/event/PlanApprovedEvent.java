package vn.ksvh.qc.inspection.api.event;

import java.util.Set;

public record PlanApprovedEvent(
        Long planId,
        String planCode,
        String title,
        Long createdBy,
        Long approverId,
        String approverName,
        Set<Long> assignedInspectorIds,
        int createdInspectionCount
) {
}

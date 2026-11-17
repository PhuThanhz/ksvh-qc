package vn.ksvh.qc.report.dto;

import java.util.List;

public record InspectorProductivityReportResponse(
        List<InspectorProductivityItem> items
) {
    public record InspectorProductivityItem(
            long inspectorId,
            String inspectorUsername,
            String inspectorFullName,
            long totalAssigned,
            long completedInspections,
            double avgDurationMinutes,
            long totalFindingsFound,
            long m3m4Count,
            double avgFindingsPerInspection
    ) {}
}

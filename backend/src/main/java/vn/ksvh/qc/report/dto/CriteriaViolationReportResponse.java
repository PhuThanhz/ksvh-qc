package vn.ksvh.qc.report.dto;

import java.util.List;

public record CriteriaViolationReportResponse(
        List<CriteriaViolationItem> items,
        long totalViolations
) {
    public record CriteriaViolationItem(
            long criterionId,
            String criterionCode,
            String criterionName,
            String groupName,
            short baseImpact,
            long violationCount,
            long restaurantCount,
            long repeatCount,
            long openCount,
            long closedCount,
            double paretoPercentage
    ) {}
}

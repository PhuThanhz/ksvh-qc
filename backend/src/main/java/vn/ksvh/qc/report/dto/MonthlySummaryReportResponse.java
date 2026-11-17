package vn.ksvh.qc.report.dto;

import java.util.List;

public record MonthlySummaryReportResponse(
        List<MonthlySummaryItem> items,
        MonthlySummaryItem summary
) {
    public record MonthlySummaryItem(
            String month,
            long totalInspections,
            long periodicCount,
            long adHocCount,
            long completedCount,
            double complianceRate,
            long totalFindings,
            long m1Count,
            long m2Count,
            long m3Count,
            long m4Count
    ) {}
}

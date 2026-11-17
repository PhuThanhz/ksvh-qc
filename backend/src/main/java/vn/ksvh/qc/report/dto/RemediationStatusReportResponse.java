package vn.ksvh.qc.report.dto;

import java.util.List;

public record RemediationStatusReportResponse(
        List<RemediationStatusItem> items,
        RemediationStatusItem summary
) {
    public record RemediationStatusItem(
            long restaurantId,
            String restaurantCode,
            String restaurantName,
            String companyName,
            String storeManagerName,
            long totalFindings,
            long resolvedOnTimeCount,
            long resolvedOverdueCount,
            long overdueOpenCount,
            long inProgressCount,
            double onTimeRate
    ) {}
}

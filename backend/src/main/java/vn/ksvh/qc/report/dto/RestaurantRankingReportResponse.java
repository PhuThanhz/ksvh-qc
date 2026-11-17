package vn.ksvh.qc.report.dto;

import java.util.List;

public record RestaurantRankingReportResponse(
        List<RestaurantRankingItem> items
) {
    public record RestaurantRankingItem(
            long restaurantId,
            String restaurantCode,
            String restaurantName,
            String companyName,
            String storeManagerName,
            long inspectionCount,
            double averageScore,
            double complianceRate,
            long openFindingsCount,
            long m1Count,
            long m2Count,
            long m3Count,
            long m4Count,
            String rankCategory
    ) {}
}

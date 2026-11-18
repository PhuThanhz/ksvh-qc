package vn.ksvh.qc.inspection.dto;

import java.time.LocalDate;
import java.util.List;

public record RestaurantRiskProfileResponse(
        Long restaurantId,
        String restaurantCode,
        String restaurantName,
        String companyName,
        String storeManagerName,
        LocalDate asOfDate,
        int periodMonths,
        LocalDate periodStart,
        Integer resetPeriodMonths,
        int totalEscalatedCriteria,
        int totalActiveFindings,
        List<CriterionRiskProfileItem> criteria
) {
}

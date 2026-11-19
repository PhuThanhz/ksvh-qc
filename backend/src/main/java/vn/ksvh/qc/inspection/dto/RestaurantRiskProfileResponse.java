package vn.ksvh.qc.inspection.dto;

import io.swagger.v3.oas.annotations.media.Schema;

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
        /** true = nhà hàng có ngưỡng nâng / hạ mức riêng, khác quy tắc chung. */
        boolean customEscalation,
        /** Ngưỡng nâng mức đang áp dụng cho nhà hàng; null nếu chưa cấu hình. */
        @Schema(nullable = true) Integer escalationThreshold,
        @Schema(nullable = true) Integer resetPeriodMonths,
        int totalEscalatedCriteria,
        int totalActiveFindings,
        List<CriterionRiskProfileItem> criteria
) {
}

package vn.ksvh.qc.inspection.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import vn.ksvh.qc.organization.api.RiskPolicy;

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
        /** Chính sách rủi ro của nhà hàng. */
        RiskPolicy riskPolicy,
        /** Ngưỡng nâng mức đang áp dụng (theo chính sách); null nếu chưa cấu hình. */
        @Schema(nullable = true) Integer escalationThreshold,
        @Schema(nullable = true) Integer resetPeriodMonths,
        int totalEscalatedCriteria,
        int totalActiveFindings,
        List<CriterionRiskProfileItem> criteria
) {
}

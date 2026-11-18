package vn.ksvh.qc.risk;

import java.time.LocalDate;

/**
 * Đánh giá trạng thái rủi ro hiện tại của cặp (nhà hàng, tiêu chí) tại một thời điểm (asOfDate),
 * bao gồm mức ảnh hưởng hiệu lực, trạng thái nâng mức, và ngày dự kiến hạ mức về mức gốc nếu sạch lỗi.
 */
public record CurrentCriterionRisk(
        int baseImpact,
        int effectiveImpact,
        boolean isEscalated,
        int frequencyInPeriod,
        LocalDate periodStart,
        LocalDate lastViolationDate,
        LocalDate expectedResetDate,
        long cleanMonthsCount,
        int projectedScore,
        RiskBand projectedBand
) {
}

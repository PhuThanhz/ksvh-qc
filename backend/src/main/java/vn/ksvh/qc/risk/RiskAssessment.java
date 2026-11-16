package vn.ksvh.qc.risk;

import java.time.LocalDate;

/**
 * Kết quả tính rủi ro cho một lần lỗi.
 *
 * @param frequency       số lần lỗi trong kỳ đếm (kể cả lần đang tính)
 * @param effectiveImpact mức ảnh hưởng sau khi áp dụng nâng mức
 * @param band            mức rủi ro; null nếu bảng phân loại không có khoảng chứa điểm này
 * @param periodStart     ngày đầu kỳ đếm
 */
public record RiskAssessment(int frequency, int baseImpact, int effectiveImpact, boolean escalated, int score,
                             RiskBand band, LocalDate periodStart) {
}

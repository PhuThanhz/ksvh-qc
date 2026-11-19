package vn.ksvh.qc.criteria.api;

import vn.ksvh.qc.organization.api.RiskPolicy;

import java.time.LocalDate;
import java.util.List;

/**
 * Cấu hình rủi ro đang hiệu lực tại một ngày (danh mục 7–9).
 * periodMonths: kỳ đếm tần suất; escalation null nếu chưa khai báo quy tắc nâng mức;
 * policy: chính sách mà quy tắc nâng mức thực sự lấy từ đó (có thể là STANDARD khi chính sách yêu cầu chưa khai báo).
 */
public record RiskConfigRef(
        LocalDate date,
        RiskPolicy policy,
        int periodMonths,
        Escalation escalation,
        List<RiskLevelRef> riskLevels) {

    public record Escalation(int thresholdCount, int stepIncrease, int maxImpact, int resetPeriodMonths) {
    }
}

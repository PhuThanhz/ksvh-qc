package vn.ksvh.qc.criteria.api;

import java.time.LocalDate;
import java.util.List;

/**
 * Cấu hình rủi ro đang hiệu lực tại một ngày (danh mục 7–9).
 * periodMonths: kỳ đếm tần suất; escalation null nếu chưa khai báo quy tắc nâng mức.
 */
public record RiskConfigRef(
        LocalDate date,
        int periodMonths,
        Escalation escalation,
        List<RiskLevelRef> riskLevels) {

    public record Escalation(int thresholdCount, int stepIncrease, int maxImpact, int resetPeriodMonths) {
    }
}

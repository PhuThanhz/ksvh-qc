package vn.ksvh.qc.risk;

import vn.ksvh.qc.criteria.api.RiskConfigRef;

import java.time.LocalDate;
import java.util.List;

/**
 * Bộ quy tắc rủi ro đang hiệu lực (kỳ đếm, nâng mức, bảng mức) – chuyển từ cấu hình danh mục 7–9.
 * Nhà hàng có ngưỡng riêng thì áp thêm bằng {@link #withEscalationOverride}.
 */
public record RiskRules(FrequencyRule frequency, EscalationRule escalation, List<RiskBand> bands) {

    public static RiskRules from(RiskConfigRef config) {
        RiskConfigRef.Escalation e = config.escalation();
        return new RiskRules(
                new FrequencyRule(config.periodMonths()),
                e == null ? null : new EscalationRule(e.thresholdCount(), e.stepIncrease(), e.maxImpact(), e.resetPeriodMonths()),
                config.riskLevels().stream()
                        .map(l -> new RiskBand(l.code(), l.name(), l.minScore(), l.maxScore(), l.remediationDays()))
                        .toList());
    }

    /**
     * Ghi đè ngưỡng nâng mức / số tháng hạ mức bằng giá trị riêng của nhà hàng (null = giữ quy tắc chung).
     * Chưa có quy tắc nâng mức chung thì không áp dụng nâng mức, kể cả khi nhà hàng có ngưỡng riêng.
     */
    public RiskRules withEscalationOverride(Integer thresholdCount, Integer resetPeriodMonths) {
        if (escalation == null || (thresholdCount == null && resetPeriodMonths == null)) {
            return this;
        }
        return new RiskRules(frequency, new EscalationRule(
                thresholdCount != null ? thresholdCount : escalation.thresholdCount(),
                escalation.stepIncrease(), escalation.maxImpact(),
                resetPeriodMonths != null ? resetPeriodMonths : escalation.resetPeriodMonths()), bands);
    }

    public RiskAssessment assess(int baseImpact, List<LocalDate> previous, LocalDate at) {
        return RiskCalculator.assess(baseImpact, previous, at, frequency, escalation, bands);
    }

    public CurrentCriterionRisk evaluateCurrentRisk(int baseImpact, List<LocalDate> occurrences, LocalDate asOfDate) {
        return RiskCalculator.evaluateCurrentRisk(baseImpact, occurrences, asOfDate, frequency, escalation, bands);
    }
}

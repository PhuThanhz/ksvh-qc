package vn.ksvh.qc.risk;

import vn.ksvh.qc.criteria.api.RiskConfigRef;

import java.time.LocalDate;
import java.util.List;

/**
 * Bộ quy tắc rủi ro đang hiệu lực (kỳ đếm, nâng mức, bảng mức) – chuyển từ cấu hình danh mục 7–9.
 * Quy tắc nâng mức đã được chọn theo chính sách rủi ro của nhà hàng khi tra {@link RiskConfigRef}.
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

    public RiskAssessment assess(int baseImpact, List<LocalDate> previous, LocalDate at) {
        return RiskCalculator.assess(baseImpact, previous, at, frequency, escalation, bands);
    }

    public CurrentCriterionRisk evaluateCurrentRisk(int baseImpact, List<LocalDate> occurrences, LocalDate asOfDate) {
        return RiskCalculator.evaluateCurrentRisk(baseImpact, occurrences, asOfDate, frequency, escalation, bands);
    }
}

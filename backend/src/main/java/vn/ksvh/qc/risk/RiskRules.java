package vn.ksvh.qc.risk;

import vn.ksvh.qc.criteria.api.RiskConfigRef;

import java.time.LocalDate;
import java.util.List;

/** Bộ quy tắc rủi ro đang hiệu lực (kỳ đếm, nâng mức, bảng mức) – chuyển từ cấu hình danh mục 7–9. */
public record RiskRules(FrequencyRule frequency, EscalationRule escalation, List<RiskBand> bands) {

    public static RiskRules from(RiskConfigRef config) {
        return forContext(config, null, null, null, null);
    }

    public static RiskRules forContext(RiskConfigRef config, String riskPolicy) {
        return forContext(config, null, null, null, riskPolicy);
    }

    public static RiskRules forContext(RiskConfigRef config,
                                       Integer templateFrequencyMonths,
                                       Integer templateEscalationThreshold,
                                       Integer templateResetMonths,
                                       String riskPolicy) {
        int period = (templateFrequencyMonths != null && templateFrequencyMonths > 0)
                ? templateFrequencyMonths : config.periodMonths();
        RiskConfigRef.Escalation e = config.escalation();
        EscalationRule escalation = null;
        if (e != null) {
            int threshold = (templateEscalationThreshold != null && templateEscalationThreshold > 0)
                    ? templateEscalationThreshold : e.thresholdCount();
            if ("STRICT".equalsIgnoreCase(riskPolicy)) {
                threshold = Math.min(threshold, 2);
            }
            int reset = (templateResetMonths != null && templateResetMonths > 0)
                    ? templateResetMonths : e.resetPeriodMonths();
            escalation = new EscalationRule(threshold, e.stepIncrease(), e.maxImpact(), reset);
        }
        return new RiskRules(
                new FrequencyRule(period),
                escalation,
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

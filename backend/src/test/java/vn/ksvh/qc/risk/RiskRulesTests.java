package vn.ksvh.qc.risk;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Ngưỡng nâng / hạ mức riêng của nhà hàng ghi đè quy tắc chung. */
class RiskRulesTests {

    private static final RiskRules COMMON = new RiskRules(new FrequencyRule(6), new EscalationRule(3, 1, 5, 6),
            List.of(new RiskBand("M2", "M2", BigDecimal.ONE, BigDecimal.valueOf(6), 30),
                    new RiskBand("M3", "M3", BigDecimal.valueOf(6), BigDecimal.valueOf(12), 7)));

    private static LocalDate t(int month) {
        return LocalDate.of(2026, month, 10);
    }

    @Test
    void restaurantThresholdEscalatesEarlier() {
        // Quy tắc chung: lần 2 chưa nâng; nhà hàng ngưỡng riêng 2 lần: lần 2 đã nâng 2 → 3, điểm 6 (M3)
        assertThat(COMMON.assess(2, List.of(t(3)), t(5)).escalated()).isFalse();
        RiskAssessment strict = COMMON.withEscalationOverride(2, null, null).assess(2, List.of(t(3)), t(5));
        assertThat(strict.escalated()).isTrue();
        assertThat(strict.effectiveImpact()).isEqualTo(3);
        assertThat(strict.score()).isEqualTo(6);
        assertThat(strict.band().code()).isEqualTo("M3");
    }

    @Test
    void overrideKeepsCommonValuesWhenBlank() {
        RiskRules r = COMMON.withEscalationOverride(null, 12, null);
        assertThat(r.escalation().thresholdCount()).isEqualTo(3);
        assertThat(r.escalation().resetPeriodMonths()).isEqualTo(12);
        assertThat(r.escalation().stepIncrease()).isEqualTo(1);
        assertThat(COMMON.withEscalationOverride(null, null, null)).isSameAs(COMMON);
    }

    @Test
    void noCommonRuleMeansNoEscalation() {
        RiskRules none = new RiskRules(new FrequencyRule(6), null, List.of());
        assertThat(none.withEscalationOverride(2, 6, 2).escalation()).isNull();
    }

    @Test
    void restaurantStepRaisesImpactFurtherButKeepsCommonCap() {
        // Nhà hàng +2 bậc: lần 3 mức 2 → 4, điểm 12; mức trần chung 5 vẫn giữ (mức 4 + 2 → 5)
        RiskRules plusTwo = COMMON.withEscalationOverride(null, null, 2);
        assertThat(plusTwo.escalation().stepIncrease()).isEqualTo(2);
        assertThat(plusTwo.escalation().thresholdCount()).isEqualTo(3);
        assertThat(plusTwo.escalation().maxImpact()).isEqualTo(5);

        RiskAssessment r = plusTwo.assess(2, List.of(t(3), t(4)), t(5));
        assertThat(r.escalated()).isTrue();
        assertThat(r.effectiveImpact()).isEqualTo(4);
        assertThat(r.score()).isEqualTo(12);

        assertThat(plusTwo.assess(4, List.of(t(3), t(4)), t(5)).effectiveImpact()).isEqualTo(5);
        // Quy tắc chung +1: cùng tình huống chỉ lên 3
        assertThat(COMMON.assess(2, List.of(t(3), t(4)), t(5)).effectiveImpact()).isEqualTo(3);
    }
}

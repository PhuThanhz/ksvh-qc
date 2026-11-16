package vn.ksvh.qc.risk;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Ví dụ kiểm thử trong docs/DOMAIN_SPEC.md §6.5 (số liệu ví dụ PDF s.14–16). */
class RiskCalculatorTests {

    private static final FrequencyRule SIX_MONTHS = new FrequencyRule(6);
    private static final EscalationRule RULE = new EscalationRule(3, 1, 5, 6);
    private static final List<RiskBand> BANDS = List.of(
            band("M1", 0, 1, 60), band("M2", 1, 6, 30), band("M3", 6, 12, 7), band("M4", 12, null, 1));

    private static RiskBand band(String code, int min, Integer max, int days) {
        return new RiskBand(code, code, BigDecimal.valueOf(min), max == null ? null : BigDecimal.valueOf(max), days);
    }

    private static LocalDate t(int month) {
        return LocalDate.of(2026, month, 10);
    }

    @Test
    void tc1_countsOnlyViolationsInLatestPeriod() {
        // Lỗi T1, T2, T3, T5, T8 – tính tại T8, kỳ 6 tháng = T3..T8 → 3 lần
        RiskAssessment r = RiskCalculator.assess(1, List.of(t(1), t(2), t(3), t(5)), t(8), SIX_MONTHS, null, BANDS);
        assertThat(r.frequency()).isEqualTo(3);
        assertThat(r.periodStart()).isEqualTo(LocalDate.of(2026, 3, 1));
    }

    @Test
    void tc2_escalatesImpactFromThirdViolation() {
        // "Bàn ghế bụi": gốc 1, ngưỡng 3, +1 bậc
        int[][] expected = {{1, 1, 1}, {2, 1, 2}, {3, 2, 6}, {4, 2, 8}}; // lần, ảnh hưởng, điểm
        String[] levels = {"M2", "M2", "M3", "M3"};
        List<LocalDate> previous = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            RiskAssessment r = RiskCalculator.assess(1, previous, t(i + 1), SIX_MONTHS, RULE, BANDS);
            assertThat(r.frequency()).isEqualTo(expected[i][0]);
            assertThat(r.effectiveImpact()).isEqualTo(expected[i][1]);
            assertThat(r.score()).isEqualTo(expected[i][2]);
            assertThat(r.band().code()).isEqualTo(levels[i]);
            previous.add(t(i + 1));
        }
    }

    @Test
    void tc3_resetsToBaseAfterCleanPeriod_andRestartsWhenViolatingAgain() {
        List<LocalDate> escalatedAtT3 = List.of(t(1), t(2), t(3));
        // T4→T9 không lỗi → lỗi ở T10 dùng mức gốc
        RiskAssessment t10 = RiskCalculator.assess(1, escalatedAtT3, t(10), SIX_MONTHS, RULE, BANDS);
        assertThat(t10.escalated()).isFalse();
        assertThat(t10.effectiveImpact()).isEqualTo(1);
        // Lỗi ở T9: mới 5 tháng sạch (T4..T8) → vẫn còn nâng mức
        assertThat(RiskCalculator.assess(1, escalatedAtT3, t(9), SIX_MONTHS, RULE, BANDS).effectiveImpact()).isEqualTo(2);
        // Biến thể: lỗi lại ở T7 → đếm lại từ T7, lỗi tiếp ở T12 vẫn nâng (T8..T11 mới 4 tháng sạch)
        List<LocalDate> withT7 = List.of(t(1), t(2), t(3), t(7));
        assertThat(RiskCalculator.assess(1, withT7, t(12), SIX_MONTHS, RULE, BANDS).effectiveImpact()).isEqualTo(2);
        assertThat(RiskCalculator.assess(1, withT7, LocalDate.of(2027, 2, 1), SIX_MONTHS, RULE, BANDS).effectiveImpact()).isEqualTo(1);
    }

    @Test
    void tc4_otherRestaurantWithoutHistoryUsesBaseImpact() {
        // Lịch sử tính theo từng nhà hàng: nhà hàng B chưa tái phạm → không có lần lỗi trước
        RiskAssessment b = RiskCalculator.assess(1, List.of(), t(3), SIX_MONTHS, RULE, BANDS);
        assertThat(b.effectiveImpact()).isEqualTo(1);
        assertThat(b.frequency()).isEqualTo(1);
    }

    @Test
    void escalationNeverExceedsCapAndBandMayBeMissing() {
        RiskAssessment r = RiskCalculator.assess(5, List.of(t(1), t(2)), t(3), SIX_MONTHS, RULE, BANDS);
        assertThat(r.effectiveImpact()).isEqualTo(5);
        assertThat(r.escalated()).isFalse(); // đã ở trần, không nâng thêm
        assertThat(RiskCalculator.assess(1, List.of(), t(1), SIX_MONTHS, null, List.of(band("X", 5, null, 1))).band()).isNull();
    }

    @Test
    void threeMonthPeriod() {
        RiskAssessment r = RiskCalculator.assess(2, List.of(t(1), t(4), t(5)), t(6), new FrequencyRule(3), RULE, BANDS);
        assertThat(r.frequency()).isEqualTo(3); // T4..T6
        assertThat(r.score()).isEqualTo(9);
    }
}

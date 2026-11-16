package vn.ksvh.qc.risk;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Tính điểm rủi ro theo DOMAIN_SPEC §6 cho cặp (nhà hàng, tiêu chí). Logic thuần, không truy cập DB.
 * <p>
 * GIẢ ĐỊNH chờ Phòng KSVH xác nhận (§8 Q3): kỳ đếm cuốn theo THÁNG DƯƠNG LỊCH – kỳ 6 tháng tính tại tháng 8
 * gồm tháng 3..8 (đúng ví dụ TC-1). Kỳ hạ mức cũng đếm theo tháng dương lịch trọn vẹn không lỗi.
 * Đổi giả định chỉ cần sửa {@link #periodStart} và {@link #cleanMonthsBetween}.
 */
public final class RiskCalculator {

    private RiskCalculator() {
    }

    /** Ngày đầu kỳ đếm chứa ngày {@code at}. */
    public static LocalDate periodStart(LocalDate at, FrequencyRule rule) {
        return at.withDayOfMonth(1).minusMonths(rule.periodMonths() - 1L);
    }

    /**
     * @param baseImpact     mức ảnh hưởng gốc của tiêu chí (1–5)
     * @param previous       ngày các lần lỗi TRƯỚC đã ghi nhận của cùng nhà hàng + tiêu chí (bất kỳ thứ tự)
     * @param at             ngày của lần lỗi đang tính (được tính là một lần lỗi)
     * @param escalation     null = không áp dụng nâng mức
     */
    public static RiskAssessment assess(int baseImpact, List<LocalDate> previous, LocalDate at,
                                        FrequencyRule frequency, EscalationRule escalation, List<RiskBand> bands) {
        List<LocalDate> dates = new ArrayList<>(previous.stream().filter(d -> !d.isAfter(at)).toList());
        dates.add(at);
        dates.sort(null);

        boolean escalated = false;
        LocalDate last = null;
        int countAtLast = 0;
        for (int i = 0; i < dates.size(); i++) {
            LocalDate d = dates.get(i);
            if (escalation != null && escalated && last != null
                    && cleanMonthsBetween(last, d) >= escalation.resetPeriodMonths()) {
                escalated = false; // đủ kỳ hạ liên tục không lỗi → về mức gốc
            }
            countAtLast = countInPeriod(dates.subList(0, i + 1), d, frequency);
            if (escalation != null && countAtLast >= escalation.thresholdCount()) {
                escalated = true;
            }
            last = d;
        }

        int effective = baseImpact;
        if (escalated) {
            effective = Math.max(baseImpact, Math.min(baseImpact + escalation.stepIncrease(), escalation.maxImpact()));
        }
        int score = effective * countAtLast;
        RiskBand band = bands.stream().filter(b -> b.contains(score)).findFirst().orElse(null);
        return new RiskAssessment(countAtLast, baseImpact, effective, escalated && effective > baseImpact, score, band,
                periodStart(at, frequency));
    }

    private static int countInPeriod(List<LocalDate> datesUpTo, LocalDate at, FrequencyRule rule) {
        LocalDate start = periodStart(at, rule);
        return (int) datesUpTo.stream().filter(d -> !d.isBefore(start) && !d.isAfter(at)).count();
    }

    /** Số tháng dương lịch trọn vẹn nằm giữa tháng của {@code from} và tháng của {@code to} (không tính hai đầu). */
    static long cleanMonthsBetween(LocalDate from, LocalDate to) {
        return ChronoUnit.MONTHS.between(YearMonth.from(from), YearMonth.from(to)) - 1;
    }
}

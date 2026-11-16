package vn.ksvh.qc.risk;

/** Cấu hình tần suất đang áp dụng: kỳ đếm (tháng). */
public record FrequencyRule(int periodMonths) {
    public FrequencyRule {
        if (periodMonths < 1) {
            throw new IllegalArgumentException("Kỳ đếm phải ≥ 1 tháng");
        }
    }
}

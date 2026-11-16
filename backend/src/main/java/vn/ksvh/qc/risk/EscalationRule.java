package vn.ksvh.qc.risk;

/**
 * Quy tắc nâng mức ảnh hưởng: lỗi ≥ thresholdCount lần trong kỳ đếm → +stepIncrease bậc (tối đa maxImpact);
 * resetPeriodMonths tháng liên tục không lỗi → về mức gốc.
 */
public record EscalationRule(int thresholdCount, int stepIncrease, int maxImpact, int resetPeriodMonths) {
}

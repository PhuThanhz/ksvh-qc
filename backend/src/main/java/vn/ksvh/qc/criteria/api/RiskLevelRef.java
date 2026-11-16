package vn.ksvh.qc.criteria.api;

import java.math.BigDecimal;

public record RiskLevelRef(
        Long id,
        String code,
        String name,
        BigDecimal minScore,
        BigDecimal maxScore,
        int remediationDays,
        String action
) {
    public boolean contains(BigDecimal score) {
        if (score == null) {
            return false;
        }
        if (score.compareTo(minScore) < 0) {
            return false;
        }
        return maxScore == null || score.compareTo(maxScore) < 0;
    }
}

package vn.ksvh.qc.risk;

import java.math.BigDecimal;

/** Một mức rủi ro: khoảng điểm [minScore, maxScore), maxScore null = không giới hạn trên. */
public record RiskBand(String code, String name, BigDecimal minScore, BigDecimal maxScore, int remediationDays) {

    public boolean contains(int score) {
        BigDecimal s = BigDecimal.valueOf(score);
        return s.compareTo(minScore) >= 0 && (maxScore == null || s.compareTo(maxScore) < 0);
    }
}

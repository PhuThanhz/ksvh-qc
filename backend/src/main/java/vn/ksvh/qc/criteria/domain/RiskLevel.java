package vn.ksvh.qc.criteria.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.ksvh.qc.shared.persistence.BaseEntity;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Mức rủi ro (danh mục 7). Khoảng điểm [minScore, maxScore); maxScore null = không giới hạn trên. */
@Entity
@Table(name = "risk_levels")
@Getter
@Setter
@NoArgsConstructor
public class RiskLevel extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "min_score", nullable = false, precision = 8, scale = 2)
    private BigDecimal minScore;

    @Column(name = "max_score", precision = 8, scale = 2)
    private BigDecimal maxScore;

    @Column(name = "remediation_days", nullable = false)
    private int remediationDays;

    @Column(length = 500)
    private String action;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    /** score thuộc mức này nếu minScore ≤ score &lt; maxScore. */
    public boolean contains(BigDecimal score) {
        return score.compareTo(minScore) >= 0 && (maxScore == null || score.compareTo(maxScore) < 0);
    }
}

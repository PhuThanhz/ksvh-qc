package vn.ksvh.qc.criteria.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;

/** Quy tắc nâng mức ảnh hưởng (danh mục 9), phiên bản theo ngày hiệu lực; không sửa sau khi tạo. */
@Entity
@Table(name = "impact_escalation_rules")
@Getter
@Setter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class EscalationRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Số lần lỗi trong kỳ đếm để bắt đầu nâng mức. */
    @Column(name = "threshold_count", nullable = false)
    private short thresholdCount;

    @Column(name = "step_increase", nullable = false)
    private short stepIncrease;

    @Column(name = "max_impact", nullable = false)
    private short maxImpact;

    /** Số tháng liên tục không lỗi để hạ về mức gốc. */
    @Column(name = "reset_period_months", nullable = false)
    private short resetPeriodMonths;

    @Column(name = "effective_from", nullable = false, unique = true)
    private LocalDate effectiveFrom;

    @Column(length = 500)
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private Long createdBy;
}

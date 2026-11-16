package vn.ksvh.qc.criteria.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;

/** Cấu hình kỳ đếm tần suất (danh mục 8), phiên bản theo ngày hiệu lực; không sửa sau khi tạo. */
@Entity
@Table(name = "frequency_configs")
@Getter
@Setter
@NoArgsConstructor
public class FrequencyConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "period_months", nullable = false)
    private short periodMonths;

    @Column(name = "effective_from", nullable = false, unique = true)
    private LocalDate effectiveFrom;

    @Column(length = 500)
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "created_by", updatable = false)
    private Long createdBy;
}

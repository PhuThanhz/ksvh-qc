package vn.ksvh.qc.criteria.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.ksvh.qc.shared.persistence.BaseEntity;

/** Tiêu chí / điểm rủi ro (danh mục 5). Mức ảnh hưởng gốc 1–5. */
@Entity
@Table(name = "criteria")
@Getter
@Setter
@NoArgsConstructor
public class Criterion extends BaseEntity {

    /** Thang mức ảnh hưởng đã chốt 12/11/2026. */
    public static final int MIN_IMPACT = 1;
    public static final int MAX_IMPACT = 5;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private CriterionGroup group;

    @Column(nullable = false, length = 30)
    private String code;

    @Column(nullable = false, length = 300)
    private String name;

    @Column(name = "check_method", columnDefinition = "text")
    private String checkMethod;

    @Column(name = "evidence_required", columnDefinition = "text")
    private String evidenceRequired;

    @Column(name = "base_impact", nullable = false)
    private short baseImpact;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "updated_by")
    private Long updatedBy;
}

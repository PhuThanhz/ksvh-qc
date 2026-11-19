package vn.ksvh.qc.criteria.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import vn.ksvh.qc.shared.persistence.BaseEntity;

import java.util.ArrayList;
import java.util.List;

/** Mẫu phiếu chấm (danh mục 6): bộ tiêu chí theo loại nhà hàng / loại kiểm tra. */
@Entity
@Table(name = "inspection_templates")
@Getter
@Setter
@NoArgsConstructor
public class InspectionTemplate extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    /** Trống = áp dụng cho mọi loại nhà hàng. */

    @Column(name = "inspection_type", length = 100)
    private String inspectionType;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "updated_by")
    private Long updatedBy;

    @ElementCollection
    @BatchSize(size = 50)
    @CollectionTable(name = "template_criteria", joinColumns = @JoinColumn(name = "template_id"))
    @OrderBy("sortOrder")
    private List<TemplateItem> items = new ArrayList<>();
}

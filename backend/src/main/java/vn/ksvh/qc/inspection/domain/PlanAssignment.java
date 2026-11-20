package vn.ksvh.qc.inspection.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.ksvh.qc.shared.persistence.BaseEntity;

import org.hibernate.annotations.BatchSize;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

/** Một dòng phân công của kế hoạch: nhà hàng × chuyên viên × (mẫu phiếu | chuyên đề) × ngày dự kiến (PDF s.9). */
@Entity
@Table(name = "inspection_plan_assignments")
@Getter
@Setter
@NoArgsConstructor
public class PlanAssignment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plan_id", nullable = false)
    private Long planId;

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    @Column(name = "inspector_id", nullable = false)
    private Long inspectorId;

    /** Mẫu phiếu – chỉ kế hoạch định kỳ. */
    @Column(name = "template_id")
    private Long templateId;

    /** Chuyên đề (nhóm tiêu chí) – chỉ kế hoạch đột xuất. */
    @ElementCollection
    @BatchSize(size = 50)
    @CollectionTable(name = "inspection_plan_assignment_topics", joinColumns = @JoinColumn(name = "plan_assignment_id"))
    @Column(name = "criterion_group_id")
    private Set<Long> topicGroupIds = new LinkedHashSet<>();

    /** Tiêu chí cụ thể tick trong các chuyên đề – chỉ kế hoạch đột xuất; rỗng = toàn bộ tiêu chí của chuyên đề. */
    @ElementCollection
    @BatchSize(size = 50)
    @CollectionTable(name = "inspection_plan_assignment_criteria", joinColumns = @JoinColumn(name = "plan_assignment_id"))
    @Column(name = "criterion_id")
    private Set<Long> criterionIds = new LinkedHashSet<>();

    /** Ngày kiểm tra dự kiến – tuỳ chọn (kế hoạch cũ). Trống = chỉ cần xong trước hạn hoàn thành của kế hoạch. */
    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    /** Phiếu chấm tạo khi kế hoạch được duyệt. */
    @Column(name = "inspection_id")
    private Long inspectionId;
}

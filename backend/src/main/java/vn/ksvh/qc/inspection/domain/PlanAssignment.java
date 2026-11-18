package vn.ksvh.qc.inspection.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.ksvh.qc.shared.persistence.BaseEntity;

import java.time.LocalDate;

/** Một dòng phân công của kế hoạch: nhà hàng × chuyên viên × mẫu phiếu × ngày dự kiến (PDF s.9). */
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

    @Column(name = "template_id", nullable = false)
    private Long templateId;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    /** Phiếu chấm tạo khi kế hoạch được duyệt. */
    @Column(name = "inspection_id")
    private Long inspectionId;
}

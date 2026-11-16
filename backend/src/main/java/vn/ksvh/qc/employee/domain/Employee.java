package vn.ksvh.qc.employee.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.ksvh.qc.shared.persistence.BaseEntity;

/** Nhân viên. orgUnitId / userId tham chiếu module khác bằng id. */
@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
public class Employee extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_code", nullable = false, length = 30)
    private String employeeCode;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "job_title", length = 150)
    private String jobTitle;

    @Column(name = "org_unit_id")
    private Long orgUnitId;

    @Column(length = 20)
    private String phone;

    @Column(length = 150)
    private String email;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "updated_by")
    private Long updatedBy;
}

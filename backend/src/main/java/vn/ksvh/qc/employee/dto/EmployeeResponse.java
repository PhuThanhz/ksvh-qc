package vn.ksvh.qc.employee.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import vn.ksvh.qc.employee.domain.Employee;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.user.api.UserSummary;

import java.time.Instant;

public record EmployeeResponse(
        Long id,
        String employeeCode,
        String fullName,
        @Schema(nullable = true) String jobTitle,
        @Schema(nullable = true) Long orgUnitId,
        @Schema(nullable = true) String orgUnitName,
        @Schema(nullable = true) String phone,
        @Schema(nullable = true) String email,
        @Schema(nullable = true) Long userId,
        @Schema(nullable = true) String username,
        boolean active,
        Instant createdAt,
        Instant updatedAt) {

    public static EmployeeResponse from(Employee e, OrgUnitRef unit, UserSummary user) {
        return new EmployeeResponse(e.getId(), e.getEmployeeCode(), e.getFullName(), e.getJobTitle(),
                e.getOrgUnitId(), unit == null ? null : unit.name(), e.getPhone(), e.getEmail(),
                e.getUserId(), user == null ? null : user.username(), e.isActive(), e.getCreatedAt(), e.getUpdatedAt());
    }
}

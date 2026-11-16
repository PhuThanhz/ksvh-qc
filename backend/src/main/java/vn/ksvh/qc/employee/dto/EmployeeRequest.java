package vn.ksvh.qc.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EmployeeRequest(
        @NotBlank(message = "Vui lòng nhập mã nhân viên")
        @Size(max = 30, message = "Mã nhân viên tối đa 30 ký tự")
        @Pattern(regexp = "^[A-Za-z0-9_-]*$", message = "Mã chỉ gồm chữ không dấu, số, dấu gạch ngang hoặc gạch dưới")
        String employeeCode,

        @NotBlank(message = "Vui lòng nhập họ tên")
        @Size(max = 150, message = "Họ tên tối đa 150 ký tự")
        String fullName,

        @Size(max = 150, message = "Chức danh tối đa 150 ký tự")
        String jobTitle,

        Long orgUnitId,

        @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
        @Pattern(regexp = "^[0-9 +().-]*$", message = "Số điện thoại chỉ gồm số và các ký tự + ( ) . -")
        String phone,

        @Size(max = 150, message = "Email tối đa 150 ký tự")
        @Email(message = "Email không hợp lệ")
        String email,

        /** Tài khoản đăng nhập liên kết (tuỳ chọn). */
        Long userId,

        boolean active) {
}

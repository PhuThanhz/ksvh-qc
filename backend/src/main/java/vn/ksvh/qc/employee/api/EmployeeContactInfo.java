package vn.ksvh.qc.employee.api;

/** Thông tin liên hệ rút gọn của nhân viên cho các module khác (như gửi thông báo). */
public record EmployeeContactInfo(
        Long userId,
        String employeeCode,
        String fullName,
        String email,
        String phone
) {}

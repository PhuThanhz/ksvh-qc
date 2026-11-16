package vn.ksvh.qc.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PasswordResetRequest(
        @NotBlank(message = "Vui lòng nhập mật khẩu mới")
        @Size(min = 8, max = 128, message = "Mật khẩu 8–128 ký tự")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Mật khẩu phải có cả chữ và số")
        String newPassword) {
}

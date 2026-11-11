package vn.ksvh.qc.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Vui lòng nhập tên đăng nhập") @Size(max = 50, message = "Tên đăng nhập tối đa 50 ký tự")
        String username,
        @NotBlank(message = "Vui lòng nhập mật khẩu") @Size(max = 128, message = "Mật khẩu tối đa 128 ký tự")
        String password) {
}

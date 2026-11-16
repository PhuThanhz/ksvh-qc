package vn.ksvh.qc.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.Set;

/** Sửa tài khoản. Tên đăng nhập không đổi được; mật khẩu đổi qua API đặt lại mật khẩu. */
public record UserUpdateRequest(
        @NotBlank(message = "Vui lòng nhập họ tên")
        @Size(max = 150, message = "Họ tên tối đa 150 ký tự")
        String fullName,

        @NotEmpty(message = "Vui lòng chọn ít nhất một vai trò")
        Set<String> roles,

        boolean active) {
}

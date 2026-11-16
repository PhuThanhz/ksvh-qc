package vn.ksvh.qc.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record UserCreateRequest(
        @NotBlank(message = "Vui lòng nhập tên đăng nhập")
        @Pattern(regexp = "^[A-Za-z0-9._-]{3,50}$", message = "Tên đăng nhập 3–50 ký tự: chữ không dấu, số, dấu chấm, gạch ngang, gạch dưới")
        String username,

        @NotBlank(message = "Vui lòng nhập họ tên")
        @Size(max = 150, message = "Họ tên tối đa 150 ký tự")
        String fullName,

        @NotBlank(message = "Vui lòng nhập mật khẩu")
        @Size(min = 8, max = 128, message = "Mật khẩu 8–128 ký tự")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Mật khẩu phải có cả chữ và số")
        String password,

        @NotEmpty(message = "Vui lòng chọn ít nhất một vai trò")
        Set<String> roles,

        boolean active) {
}

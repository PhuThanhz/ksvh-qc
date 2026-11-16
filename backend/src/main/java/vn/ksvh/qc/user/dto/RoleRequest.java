package vn.ksvh.qc.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Set;

/** Tạo / sửa vai trò. Khi sửa, mã bị bỏ qua (mã không đổi được). */
public record RoleRequest(
        @NotBlank(message = "Vui lòng nhập mã vai trò")
        @Pattern(regexp = "^[A-Z][A-Z0-9_]{1,49}$", message = "Mã vai trò gồm chữ in hoa không dấu, số, dấu gạch dưới; bắt đầu bằng chữ; 2–50 ký tự")
        String code,

        @NotBlank(message = "Vui lòng nhập tên vai trò")
        @Size(max = 100, message = "Tên vai trò tối đa 100 ký tự")
        String name,

        @Size(max = 255, message = "Mô tả tối đa 255 ký tự")
        String description,

        @NotNull(message = "Thiếu danh sách quyền")
        Set<String> permissions) {
}

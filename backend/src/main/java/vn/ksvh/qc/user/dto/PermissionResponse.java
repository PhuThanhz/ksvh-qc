package vn.ksvh.qc.user.dto;

import java.util.List;

/** Một permission trong danh mục (định nghĩa ở code) kèm các vai trò đang có quyền này. */
public record PermissionResponse(String code, String module, String description, List<String> roles) {
}

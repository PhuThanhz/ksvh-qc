package vn.ksvh.qc.user.api;

import java.util.Set;

/** Thông tin rút gọn của người dùng cho module khác hiển thị / kiểm tra vai trò. */
public record UserSummary(Long id, String username, String fullName, boolean active, Set<String> roles) {

    public boolean hasRole(String roleCode) {
        return roles.contains(roleCode);
    }
}

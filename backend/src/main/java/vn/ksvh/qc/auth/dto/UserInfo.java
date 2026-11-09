package vn.ksvh.qc.auth.dto;

import vn.ksvh.qc.user.Role;
import vn.ksvh.qc.user.User;

public record UserInfo(Long id, String username, String fullName, Role role) {
    public static UserInfo from(User u) {
        return new UserInfo(u.getId(), u.getUsername(), u.getFullName(), u.getRole());
    }
}

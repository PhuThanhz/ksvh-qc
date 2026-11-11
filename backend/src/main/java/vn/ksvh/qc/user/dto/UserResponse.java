package vn.ksvh.qc.user.dto;

import vn.ksvh.qc.user.domain.User;

import java.time.Instant;
import java.util.List;

public record UserResponse(Long id, String username, String fullName, boolean active, List<String> roles,
                           Instant createdAt) {

    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getFullName(), u.isActive(),
                u.roleCodes().stream().sorted().toList(), u.getCreatedAt());
    }
}

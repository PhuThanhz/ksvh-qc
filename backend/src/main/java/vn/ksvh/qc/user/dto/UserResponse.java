package vn.ksvh.qc.user.dto;

import vn.ksvh.qc.user.domain.User;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

public record UserResponse(Long id, String username, String fullName, boolean active, List<String> roles,
                           Instant createdAt, Instant updatedAt,
                           Instant lastLoginAt, Boolean online) {

    public static UserResponse from(User u) {
        boolean isOnline = u.getLastLoginAt() != null &&
                Duration.between(u.getLastLoginAt(), Instant.now()).abs().toMinutes() < 30;
        return new UserResponse(u.getId(), u.getUsername(), u.getFullName(), u.isActive(),
                u.roleCodes().stream().sorted().toList(), u.getCreatedAt(), u.getUpdatedAt(),
                u.getLastLoginAt(), isOnline);
    }
}

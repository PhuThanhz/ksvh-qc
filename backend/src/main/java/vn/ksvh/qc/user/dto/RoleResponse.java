package vn.ksvh.qc.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import vn.ksvh.qc.user.domain.Role;

import java.time.Instant;
import java.util.List;

public record RoleResponse(
        Long id,
        String code,
        String name,
        @Schema(nullable = true) String description,
        boolean systemRole,
        List<String> permissions,
        long userCount,
        Instant updatedAt,
        @Schema(nullable = true) String updatedByName) {

    public static RoleResponse from(Role r, long userCount, String updatedByName) {
        return new RoleResponse(r.getId(), r.getCode(), r.getName(), r.getDescription(), r.isSystemRole(),
                r.getPermissions().stream().sorted().toList(), userCount, r.getUpdatedAt(), updatedByName);
    }
}

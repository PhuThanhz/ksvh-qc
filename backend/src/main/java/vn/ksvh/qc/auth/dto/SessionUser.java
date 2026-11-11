package vn.ksvh.qc.auth.dto;

import vn.ksvh.qc.security.permission.Permission;
import vn.ksvh.qc.user.api.UserAccount;

import java.util.List;
import java.util.Optional;

/** Người dùng của phiên hiện tại. permissions dùng enum để OpenAPI sinh type union cho frontend. */
public record SessionUser(Long id, String username, String fullName, List<String> roles,
                          List<Permission> permissions) {

    public static SessionUser from(UserAccount a) {
        return new SessionUser(a.id(), a.username(), a.fullName(),
                a.roles().stream().sorted().toList(),
                a.permissions().stream().map(Permission::fromCode).flatMap(Optional::stream).sorted().toList());
    }
}

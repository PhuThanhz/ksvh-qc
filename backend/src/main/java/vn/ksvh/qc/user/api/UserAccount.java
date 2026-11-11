package vn.ksvh.qc.user.api;

import java.util.Set;

/** Ảnh chụp tài khoản để xác thực. permissions = hợp các permission của mọi role. */
public record UserAccount(Long id, String username, String fullName, String passwordHash, boolean active,
                          Set<String> roles, Set<String> permissions) {
}

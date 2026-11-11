package vn.ksvh.qc.security.jwt;

import java.util.Set;

/** Thông tin đưa vào access token. Module auth dựng từ dữ liệu user. */
public record AccessTokenSubject(Long userId, String username, Set<String> roles, Set<String> permissions) {
}

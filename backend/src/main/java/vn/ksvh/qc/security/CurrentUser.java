package vn.ksvh.qc.security;

import org.springframework.security.oauth2.jwt.Jwt;
import vn.ksvh.qc.security.jwt.JwtService;

import java.util.List;
import java.util.Set;

/**
 * Người dùng đang gọi API, dựng từ access token.
 * Dùng trong controller: {@code CurrentUser.from(jwt)} với {@code @AuthenticationPrincipal Jwt jwt}.
 */
public record CurrentUser(Long id, String username, Set<String> permissions) {

    public static CurrentUser from(Jwt jwt) {
        Number uid = jwt.getClaim(JwtService.CLAIM_UID);
        List<String> perms = jwt.getClaimAsStringList(JwtService.CLAIM_PERMISSIONS);
        return new CurrentUser(uid == null ? null : uid.longValue(), jwt.getSubject(),
                perms == null ? Set.of() : Set.copyOf(perms));
    }

    public boolean has(String permissionCode) {
        return permissions.contains(permissionCode);
    }
}

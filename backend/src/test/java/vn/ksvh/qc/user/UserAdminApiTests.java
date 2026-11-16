package vn.ksvh.qc.user;

import org.junit.jupiter.api.Test;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.support.ApiTestSupport;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Tạo / sửa / khoá tài khoản, đặt lại mật khẩu và các chốt chặn tự khoá. */
class UserAdminApiTests extends ApiTestSupport {

    private static final String[] ADMIN = {PermissionCodes.USER_READ, PermissionCodes.USER_MANAGE};

    @Test
    void createsUserWithLowercaseUsernameAndRoles() throws Exception {
        long actor = insertUser("actor_" + suffix, RoleCodes.SYSTEM_ADMIN);
        mvc.perform(withJson(post("/api/v1/users"), Map.of(
                        "username", "NV_" + suffix, "fullName", "Nguyễn Văn A", "password", "matkhau123",
                        "roles", List.of(RoleCodes.KSVH_INSPECTOR, RoleCodes.OBM), "active", true))
                        .with(as(actor, ADMIN)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("nv_" + suffix))
                .andExpect(jsonPath("$.roles.length()").value(2));

        String hash = jdbc.queryForObject("SELECT password_hash FROM users WHERE username = ?", String.class, "nv_" + suffix);
        assertThat(hash).startsWith("{bcrypt}").doesNotContain("matkhau123");
    }

    @Test
    void rejectsWeakPasswordDuplicateUsernameAndUnknownRole() throws Exception {
        long actor = insertUser("actor_" + suffix, RoleCodes.SYSTEM_ADMIN);
        insertUser("dup_" + suffix, RoleCodes.OBM);

        mvc.perform(withJson(post("/api/v1/users"), Map.of("username", "x_" + suffix, "fullName", "X",
                        "password", "chuachuso", "roles", List.of(RoleCodes.OBM), "active", true)).with(as(actor, ADMIN)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").value("Mật khẩu phải có cả chữ và số"));

        mvc.perform(withJson(post("/api/v1/users"), Map.of("username", "DUP_" + suffix, "fullName", "X",
                        "password", "matkhau123", "roles", List.of(RoleCodes.OBM), "active", true)).with(as(actor, ADMIN)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USER_USERNAME_TAKEN"));

        mvc.perform(withJson(post("/api/v1/users"), Map.of("username", "y_" + suffix, "fullName", "Y",
                        "password", "matkhau123", "roles", List.of("KHONG_CO"), "active", true)).with(as(actor, ADMIN)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ROLE_UNKNOWN"));
    }

    @Test
    void adminCannotLockThemselves() throws Exception {
        long actor = insertUser("actor_" + suffix, RoleCodes.SYSTEM_ADMIN);
        mvc.perform(withJson(put("/api/v1/users/" + actor), Map.of("fullName", "Tôi",
                        "roles", List.of(RoleCodes.SYSTEM_ADMIN), "active", false)).with(as(actor, ADMIN)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("USER_SELF_LOCKOUT"));

        mvc.perform(withJson(put("/api/v1/users/" + actor), Map.of("fullName", "Tôi",
                        "roles", List.of(RoleCodes.OBM), "active", true)).with(as(actor, ADMIN)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("USER_SELF_LOCKOUT"));
    }

    @Test
    void lastActiveSystemAdminCannotBeRemoved() throws Exception {
        // Khoá mọi Quản trị hệ thống khác trong transaction này (rollback sau test).
        long target = insertUser("onlyadmin_" + suffix, RoleCodes.SYSTEM_ADMIN);
        jdbc.update("""
                UPDATE users SET active = false WHERE id <> ? AND id IN (
                  SELECT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.code = 'SYSTEM_ADMIN')
                """, target);
        long actor = insertUser("manager_" + suffix, RoleCodes.SYSTEM_ADMIN);
        jdbc.update("UPDATE users SET active = false WHERE id = ?", actor);

        mvc.perform(withJson(put("/api/v1/users/" + target), Map.of("fullName", "Admin",
                        "roles", List.of(RoleCodes.OBM), "active", true)).with(as(actor, ADMIN)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("USER_LAST_ADMIN"));
    }

    @Test
    void lockingAndPasswordResetRevokeRefreshTokens() throws Exception {
        long actor = insertUser("actor_" + suffix, RoleCodes.SYSTEM_ADMIN);
        long target = insertUser("target_" + suffix, RoleCodes.OBM);
        insertRefreshToken(target);

        mvc.perform(withJson(post("/api/v1/users/" + target + "/reset-password"), Map.of("newPassword", "moi123456"))
                        .with(as(actor, ADMIN)))
                .andExpect(status().isNoContent());
        assertThat(activeTokens(target)).isZero();

        insertRefreshToken(target);
        mvc.perform(withJson(put("/api/v1/users/" + target), Map.of("fullName", "Bị khoá",
                        "roles", List.of(RoleCodes.OBM), "active", false)).with(as(actor, ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
        assertThat(activeTokens(target)).isZero();
        assertThat(jdbc.queryForObject("SELECT updated_by FROM users WHERE id = ?", Long.class, target)).isEqualTo(actor);
    }

    @Test
    void readerCannotWrite() throws Exception {
        mvc.perform(withJson(post("/api/v1/users"), Map.of("username", "z_" + suffix, "fullName", "Z",
                        "password", "matkhau123", "roles", List.of(RoleCodes.OBM), "active", true))
                        .with(as(1L, PermissionCodes.USER_READ)))
                .andExpect(status().isForbidden());
    }

    private void insertRefreshToken(long userId) {
        Instant exp = Instant.now().plusSeconds(3600);
        jdbc.update("""
                INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at, family_expires_at)
                VALUES (?, ?, ?, ?, ?)
                """, userId, UUID.randomUUID().toString().replace("-", "") + "00000000000000000000000000000000".substring(0, 32),
                UUID.randomUUID(), java.sql.Timestamp.from(exp), java.sql.Timestamp.from(exp));
    }

    private int activeTokens(long userId) {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM refresh_tokens WHERE user_id = ? AND revoked_at IS NULL",
                Integer.class, userId);
        return n == null ? 0 : n;
    }
}

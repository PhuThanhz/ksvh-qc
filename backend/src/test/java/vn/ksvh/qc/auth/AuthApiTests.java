package vn.ksvh.qc.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import vn.ksvh.qc.auth.service.LoginAttemptService;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.support.ApiTestSupport;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthApiTests extends ApiTestSupport {

    @Autowired
    private LoginAttemptService loginAttemptService;

    private String testUsername;

    @BeforeEach
    void setUp() {
        testUsername = "auth_user_" + suffix.toLowerCase();
        insertUser(testUsername, "Password@123", RoleCodes.KSVH_INSPECTOR);
        loginAttemptService.clear(testUsername, "127.0.0.1");
    }

    @Test
    void testSuccessfulLogin() throws Exception {
        mvc.perform(withJson(post("/api/v1/auth/login"), Map.of(
                        "username", testUsername,
                        "password", "Password@123"
                )))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.username").value(testUsername));
    }

    @Test
    void testFailedLoginAndLockoutOnSixthAttempt() throws Exception {
        // 5 lần đầu thử sai mật khẩu -> 401 UNAUTHORIZED
        for (int i = 1; i <= 5; i++) {
            mvc.perform(withJson(post("/api/v1/auth/login"), Map.of(
                            "username", testUsername,
                            "password", "WrongPassword"
                    )))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"));
        }

        // Lần thứ 6 bị chặn ngay -> 429 TOO_MANY_REQUESTS và mã AUTH_ACCOUNT_LOCKED
        mvc.perform(withJson(post("/api/v1/auth/login"), Map.of(
                        "username", testUsername,
                        "password", "WrongPassword"
                )))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("AUTH_ACCOUNT_LOCKED"))
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("bị tạm khoá")));

        // Kiểm tra audit log đã ghi nhận sự kiện LOGIN_LOCKOUT
        Integer count = jdbc.queryForObject(
                "SELECT count(*) FROM audit_logs WHERE action = 'LOGIN_LOCKOUT' AND target_id = ?",
                Integer.class, testUsername
        );
        assertThat(count).isGreaterThanOrEqualTo(1);
    }

    private long insertUser(String username, String password, String roleCode) {
        Long id = jdbc.queryForObject("""
                INSERT INTO users (username, password_hash, full_name, active)
                VALUES (?, '{noop}' || ?, 'Test User', true) RETURNING id
                """, Long.class, username, password);
        jdbc.update("INSERT INTO user_roles (user_id, role_id) SELECT ?, id FROM roles WHERE code = ?", id, roleCode);
        return id;
    }
}

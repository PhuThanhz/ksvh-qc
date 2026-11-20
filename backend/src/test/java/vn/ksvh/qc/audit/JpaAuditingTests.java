package vn.ksvh.qc.audit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.organization.domain.Company;
import vn.ksvh.qc.organization.domain.CompanyRepository;
import vn.ksvh.qc.security.jwt.JwtService;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class JpaAuditingTests {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private JdbcTemplate jdbc;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private long createTestUser(String username) {
        return jdbc.queryForObject("""
                INSERT INTO users (username, password_hash, full_name)
                VALUES (?, '{noop}x', ?)
                RETURNING id
                """, Long.class, username, "Họ Tên " + username);
    }

    private void authenticateAsUser(long userId) {
        Jwt jwt = new Jwt(
                "mock-token",
                Instant.now(),
                Instant.now().plusSeconds(3600),
                Map.of("alg", "HS256"),
                Map.of("sub", "user" + userId, JwtService.CLAIM_UID, userId)
        );
        JwtAuthenticationToken auth = new JwtAuthenticationToken(jwt, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void testAuditFieldsAutoPopulatedOnInsertAndUpdate() {
        long user1Id = createTestUser("audit_user_1_" + System.currentTimeMillis());
        long user2Id = createTestUser("audit_user_2_" + System.currentTimeMillis());

        // 1. Tạo công ty với user 1
        authenticateAsUser(user1Id);

        Company company = new Company();
        company.setCode("AUDIT_TEST_" + System.currentTimeMillis());
        company.setName("Công ty Kiểm tra Audit");
        company = companyRepository.saveAndFlush(company);

        assertThat(company.getCreatedAt()).isNotNull();
        assertThat(company.getCreatedBy()).isEqualTo(user1Id);
        assertThat(company.getUpdatedAt()).isNotNull();
        assertThat(company.getUpdatedBy()).isEqualTo(user1Id);

        // 2. Cập nhật với user 2
        authenticateAsUser(user2Id);

        company.setName("Công ty Kiểm tra Audit Đã Sửa");
        Company updated = companyRepository.saveAndFlush(company);

        // created_by vẫn là user1 ban đầu
        assertThat(updated.getCreatedBy()).isEqualTo(user1Id);
        // updated_by đã chuyển sang user2 mới
        assertThat(updated.getUpdatedBy()).isEqualTo(user2Id);
        assertThat(updated.getUpdatedAt()).isNotNull();
    }
}

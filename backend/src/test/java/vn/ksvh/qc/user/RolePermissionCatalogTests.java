package vn.ksvh.qc.user;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import vn.ksvh.qc.security.permission.Permission;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Đảm bảo danh mục permission trong code và bảng role_permissions (seed bằng Flyway) luôn khớp,
 * và đủ 8 vai trò theo docs/DOMAIN_SPEC.md §2.
 */
@SpringBootTest
class RolePermissionCatalogTests {

    private static final Set<String> EXPECTED_ROLES = Set.of(
            "SYSTEM_ADMIN", "BUSINESS_ADMIN", "KSVH_LEAD", "KSVH_MANAGER",
            "KSVH_INSPECTOR", "STORE_MANAGER", "OBM", "EXECUTIVE");

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void hasExactlyTheEightBusinessRoles() {
        List<String> roles = jdbc.queryForList("SELECT code FROM roles", String.class);
        assertThat(roles).containsExactlyInAnyOrderElementsOf(EXPECTED_ROLES);
    }

    @Test
    void everyRoleHasAtLeastOnePermission() {
        List<String> empty = jdbc.queryForList("""
                SELECT r.code FROM roles r
                WHERE NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id)
                """, String.class);
        assertThat(empty).as("Vai trò chưa có quyền nào").isEmpty();
    }

    @Test
    void everyCodePermissionIsGrantedAndEveryDbPermissionExistsInCode() {
        Set<String> inDb = new HashSet<>(jdbc.queryForList("SELECT DISTINCT permission FROM role_permissions", String.class));
        Set<String> inCode = Arrays.stream(Permission.values()).map(Permission::code).collect(Collectors.toSet());

        assertThat(inCode).as("Permission trong code chưa gán cho role nào").isSubsetOf(inDb);
        assertThat(inDb).as("Permission trong DB không có trong code").isSubsetOf(inCode);
    }

    @Test
    void executiveIsReadOnly() {
        List<String> perms = permissionsOf("EXECUTIVE");
        assertThat(perms).allMatch(p -> p.contains(":read") || p.equals("report:export"),
                "Ban Giám đốc chỉ được xem / xuất báo cáo");
    }

    @Test
    void keyBusinessStepsAreGrantedToTheRightRoles() {
        Map<String, String> stepToRole = Map.of(
                "plan:create", "KSVH_LEAD",
                "plan:approve", "KSVH_MANAGER",
                "inspection:perform", "KSVH_INSPECTOR",
                "finding:respond", "STORE_MANAGER",
                "finding:remediate", "STORE_MANAGER",
                "finding:verify", "KSVH_INSPECTOR",
                "finding:conclude-appeal", "KSVH_MANAGER",
                "criteria:manage", "BUSINESS_ADMIN",
                "user:manage", "SYSTEM_ADMIN");
        stepToRole.forEach((perm, role) -> assertThat(permissionsOf(role)).as(role).contains(perm));
        assertThat(permissionsOf("OBM")).contains("finding:review-appeal");
        // Chuyên viên không được tự duyệt kế hoạch hay chốt khiếu nại.
        assertThat(permissionsOf("KSVH_INSPECTOR")).doesNotContain("plan:approve", "finding:conclude-appeal");
    }

    private List<String> permissionsOf(String roleCode) {
        return jdbc.queryForList("""
                SELECT rp.permission FROM role_permissions rp JOIN roles r ON r.id = rp.role_id
                WHERE r.code = ?
                """, String.class, roleCode);
    }
}

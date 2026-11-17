package vn.ksvh.qc.audit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import vn.ksvh.qc.audit.domain.AuditLog;
import vn.ksvh.qc.audit.domain.AuditLogRepository;
import vn.ksvh.qc.audit.service.AuditLogService;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.shared.audit.AuditLogEvent;
import vn.ksvh.qc.support.ApiTestSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuditLogApiTests extends ApiTestSupport {

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private static final String[] LOG_READ_PERMS = new String[]{PermissionCodes.SYSTEM_LOG_READ};

    @Test
    void testRecordAndSearchAuditLogs() throws Exception {
        long adminId = insertUser("audit_admin", RoleCodes.SYSTEM_ADMIN);

        // Ghi một số sự kiện mẫu
        auditLogService.record(AuditLogEvent.of(
                adminId,
                "audit_admin",
                "Quản trị viên",
                "USER_UPDATE",
                "USER",
                "inspector1",
                "Cập nhật tài khoản inspector1 (active=true)",
                "{\"active\":true}"
        ));

        auditLogService.record(AuditLogEvent.of(
                adminId,
                "audit_admin",
                "Quản trị viên",
                "ROLE_UPDATE",
                "ROLE",
                "KSVH_INSPECTOR",
                "Cập nhật vai trò KSVH_INSPECTOR với 5 quyền",
                "{\"permissions\":[\"inspection:perform\"]}"
        ));

        // 1. Tìm kiếm không bộ lọc
        mvc.perform(get("/api/v1/audit-logs")
                        .with(as(adminId, LOG_READ_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));

        // 2. Tìm kiếm theo action
        mvc.perform(get("/api/v1/audit-logs")
                        .param("action", "USER_UPDATE")
                        .with(as(adminId, LOG_READ_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].action").value("USER_UPDATE"))
                .andExpect(jsonPath("$.content[0].targetId").value("inspector1"));

        // 3. Tìm kiếm theo keyword
        mvc.perform(get("/api/v1/audit-logs")
                        .param("keyword", "KSVH_INSPECTOR")
                        .with(as(adminId, LOG_READ_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].action").value("ROLE_UPDATE"))
                .andExpect(jsonPath("$.content[0].targetId").value("KSVH_INSPECTOR"));

        // 4. Lấy danh sách actions
        mvc.perform(get("/api/v1/audit-logs/actions")
                        .with(as(adminId, LOG_READ_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").value(org.hamcrest.Matchers.hasItems("USER_UPDATE", "ROLE_UPDATE")));

        // 5. Lấy danh sách target types
        mvc.perform(get("/api/v1/audit-logs/target-types")
                        .with(as(adminId, LOG_READ_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").value(org.hamcrest.Matchers.hasItems("USER", "ROLE")));
    }

    @Test
    void testPermissionAccessControl() throws Exception {
        long inspectorId = insertUser("audit_inspector", RoleCodes.KSVH_INSPECTOR);

        // Chuyên viên không có quyền system:log:read -> 403
        mvc.perform(get("/api/v1/audit-logs")
                        .with(as(inspectorId, new String[]{PermissionCodes.INSPECTION_PERFORM})))
                .andExpect(status().isForbidden());
    }
}

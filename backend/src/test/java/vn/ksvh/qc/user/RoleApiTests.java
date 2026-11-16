package vn.ksvh.qc.user;

import org.junit.jupiter.api.Test;
import vn.ksvh.qc.security.permission.Permission;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.support.ApiTestSupport;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Tạo / sửa / xoá vai trò, danh mục permission, bảo vệ vai trò gốc. */
class RoleApiTests extends ApiTestSupport {

    @Test
    void permissionCatalogListsEveryCodePermissionWithDescriptionAndRoles() throws Exception {
        mvc.perform(get("/api/v1/permissions").with(as(1L, PermissionCodes.USER_READ)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(Permission.values().length))
                .andExpect(jsonPath("$[?(@.code == 'plan:approve')].module").value("plan"))
                .andExpect(jsonPath("$[?(@.code == 'plan:approve')].roles[0]").value(RoleCodes.KSVH_MANAGER));
    }

    @Test
    void createsCustomRoleEditsPermissionsAndDeletesIt() throws Exception {
        long actor = insertUser("actor_" + suffix, RoleCodes.SYSTEM_ADMIN);
        String code = "AUDIT_VIEWER_" + suffix.toUpperCase();
        String res = mvc.perform(withJson(post("/api/v1/roles"), Map.of("code", code, "name", "Xem phiếu",
                        "permissions", List.of(PermissionCodes.INSPECTION_READ_ALL))).with(as(actor, PermissionCodes.ROLE_MANAGE)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.systemRole").value(false))
                .andExpect(jsonPath("$.updatedByName").value("Test actor_" + suffix))
                .andReturn().getResponse().getContentAsString();
        long id = read(res).get("id").asLong();

        mvc.perform(withJson(put("/api/v1/roles/" + id), Map.of("code", "IGNORED", "name", "Xem phiếu + báo cáo",
                        "permissions", List.of(PermissionCodes.INSPECTION_READ_ALL, PermissionCodes.REPORT_READ)))
                        .with(as(actor, PermissionCodes.ROLE_MANAGE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(code))
                .andExpect(jsonPath("$.permissions.length()").value(2));

        mvc.perform(delete("/api/v1/roles/" + id).with(as(actor, PermissionCodes.ROLE_MANAGE)))
                .andExpect(status().isNoContent());
    }

    @Test
    void unknownPermissionIsRejected() throws Exception {
        mvc.perform(withJson(post("/api/v1/roles"), Map.of("code", "X_" + suffix.toUpperCase(), "name", "X",
                        "permissions", List.of("khong:co"))).with(as(1L, PermissionCodes.ROLE_MANAGE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PERMISSION_UNKNOWN"));
    }

    @Test
    void systemRolesAreProtected() throws Exception {
        long adminRoleId = roleId(RoleCodes.SYSTEM_ADMIN);
        mvc.perform(delete("/api/v1/roles/" + adminRoleId).with(as(1L, PermissionCodes.ROLE_MANAGE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ROLE_SYSTEM_PROTECTED"));

        mvc.perform(withJson(put("/api/v1/roles/" + adminRoleId), Map.of("code", RoleCodes.SYSTEM_ADMIN,
                        "name", "Quản trị hệ thống", "permissions", List.of(PermissionCodes.USER_READ)))
                        .with(as(1L, PermissionCodes.ROLE_MANAGE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ROLE_SYSTEM_PROTECTED"));
    }

    @Test
    void roleInUseCannotBeDeleted() throws Exception {
        String code = "TMP_" + suffix.toUpperCase();
        Long id = jdbc.queryForObject("INSERT INTO roles (code, name) VALUES (?, 'Tạm') RETURNING id", Long.class, code);
        insertUser("holder_" + suffix, code);

        mvc.perform(delete("/api/v1/roles/" + id).with(as(1L, PermissionCodes.ROLE_MANAGE)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ROLE_IN_USE"));
    }

    @Test
    void userManagerCanReadRolesButNotEdit() throws Exception {
        mvc.perform(get("/api/v1/roles").with(as(1L, PermissionCodes.USER_READ))).andExpect(status().isOk());
        mvc.perform(withJson(post("/api/v1/roles"), Map.of("code", "Y_" + suffix.toUpperCase(), "name", "Y",
                        "permissions", List.of())).with(as(1L, PermissionCodes.USER_READ, PermissionCodes.USER_MANAGE)))
                .andExpect(status().isForbidden());
    }

    private long roleId(String code) {
        Long id = jdbc.queryForObject("SELECT id FROM roles WHERE code = ?", Long.class, code);
        return id == null ? -1 : id;
    }
}

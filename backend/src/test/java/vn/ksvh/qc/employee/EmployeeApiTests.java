package vn.ksvh.qc.employee;

import org.junit.jupiter.api.Test;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.support.ApiTestSupport;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Hồ sơ nhân viên: gắn đơn vị, liên kết tài khoản, chống trùng. */
class EmployeeApiTests extends ApiTestSupport {

    private static final String[] MANAGE = {PermissionCodes.EMPLOYEE_READ, PermissionCodes.EMPLOYEE_MANAGE};

    @Test
    void createsEmployeeLinkedToUnitAndAccount() throws Exception {
        long unit = insertUnit(true);
        long account = insertUser("nv_" + suffix, RoleCodes.KSVH_INSPECTOR);
        Map<String, Object> body = employee("NV-" + suffix);
        body.put("orgUnitId", unit);
        body.put("userId", account);

        mvc.perform(withJson(post("/api/v1/employees"), body).with(as(1L, MANAGE)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orgUnitName").value("Phòng test " + suffix))
                .andExpect(jsonPath("$.username").value("nv_" + suffix));

        mvc.perform(get("/api/v1/employees").param("orgUnitId", String.valueOf(unit)).with(as(1L, MANAGE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(1));
    }

    @Test
    void accountCanBeLinkedToOnlyOneEmployee() throws Exception {
        long account = insertUser("nv_" + suffix, RoleCodes.KSVH_INSPECTOR);
        Map<String, Object> first = employee("NV1-" + suffix);
        first.put("userId", account);
        mvc.perform(withJson(post("/api/v1/employees"), first).with(as(1L, MANAGE))).andExpect(status().isCreated());

        Map<String, Object> second = employee("NV2-" + suffix);
        second.put("userId", account);
        mvc.perform(withJson(post("/api/v1/employees"), second).with(as(1L, MANAGE)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMPLOYEE_ACCOUNT_LINKED"));
    }

    @Test
    void inactiveUnitDuplicateCodeAndBadEmailAreRejected() throws Exception {
        Map<String, Object> body = employee("NV-" + suffix);
        body.put("orgUnitId", insertUnit(false));
        mvc.perform(withJson(post("/api/v1/employees"), body).with(as(1L, MANAGE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("EMPLOYEE_INVALID_ORG_UNIT"));

        mvc.perform(withJson(post("/api/v1/employees"), employee("NV-" + suffix)).with(as(1L, MANAGE)))
                .andExpect(status().isCreated());
        mvc.perform(withJson(post("/api/v1/employees"), employee("nv-" + suffix)).with(as(1L, MANAGE)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMPLOYEE_CODE_TAKEN"));

        Map<String, Object> badEmail = employee("NV3-" + suffix);
        badEmail.put("email", "khong-phai-email");
        mvc.perform(withJson(post("/api/v1/employees"), badEmail).with(as(1L, MANAGE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").value("Email không hợp lệ"));
    }

    @Test
    void readerCannotWrite() throws Exception {
        mvc.perform(withJson(post("/api/v1/employees"), employee("NV-" + suffix))
                        .with(as(1L, PermissionCodes.EMPLOYEE_READ)))
                .andExpect(status().isForbidden());
    }

    private static Map<String, Object> employee(String code) {
        Map<String, Object> m = new HashMap<>();
        m.put("employeeCode", code);
        m.put("fullName", "Trần Thị B");
        m.put("jobTitle", "Chuyên viên KSVH");
        m.put("phone", "0901 234 567");
        m.put("email", "b@example.com");
        m.put("active", true);
        return m;
    }

    private long insertUnit(boolean active) {
        Long company = jdbc.queryForObject("INSERT INTO companies (code, name) VALUES (?, 'Cty test') RETURNING id",
                Long.class, "C" + suffix);
        Long id = jdbc.queryForObject("""
                INSERT INTO org_units (company_id, unit_type, code, name, active) VALUES (?, 'DEPARTMENT', ?, ?, ?) RETURNING id
                """, Long.class, company, "PB" + suffix + active, "Phòng test " + suffix, active);
        return id == null ? -1 : id;
    }
}

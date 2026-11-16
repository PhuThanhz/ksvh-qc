package vn.ksvh.qc.organization;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.json.JsonMapper;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.security.permission.RoleCodes;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** API công ty, nhà hàng / phòng ban. Mỗi test chạy trong transaction và được rollback. */
@SpringBootTest
@Transactional
class OrganizationApiTests {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private JsonMapper jsonMapper;

    private MockMvc mvc;
    private String suffix;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
        suffix = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    @Test
    void createsRestaurantWithGpsAndAssigneesAndReturnsTheirNames() throws Exception {
        long companyId = createCompany("CTY-" + suffix);
        long cht = insertUser("cht", RoleCodes.STORE_MANAGER);
        long obm = insertUser("obm", RoleCodes.OBM);

        Map<String, Object> body = restaurant(companyId, "NH-" + suffix);
        body.put("storeManagerUserId", cht);
        body.put("obmUserId", obm);

        postOrgUnit(body, manager())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.unitType").value("RESTAURANT"))
                .andExpect(jsonPath("$.companyCode").value("CTY-" + suffix))
                .andExpect(jsonPath("$.storeManager.fullName").value("Test cht " + suffix))
                .andExpect(jsonPath("$.obm.fullName").value("Test obm " + suffix))
                .andExpect(jsonPath("$.checkinRadiusM").value(100));
    }

    @Test
    void gpsIsOptionalButCoordinatesMustBePaired() throws Exception {
        long companyId = createCompany("CTY-" + suffix);
        Map<String, Object> half = restaurant(companyId, "NH-" + suffix);
        half.remove("latitude");
        postOrgUnit(half, manager())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ORGANIZATION_GPS_REQUIRED"));

        Map<String, Object> none = restaurant(companyId, "NH2-" + suffix);
        none.remove("latitude");
        none.remove("longitude");
        none.remove("checkinRadiusM");
        postOrgUnit(none, manager())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.latitude").value(nullValue()));
    }

    @Test
    void storeManagerMustHaveStoreManagerRole() throws Exception {
        long companyId = createCompany("CTY-" + suffix);
        long inspector = insertUser("cv", RoleCodes.KSVH_INSPECTOR);
        Map<String, Object> body = restaurant(companyId, "NH-" + suffix);
        body.put("storeManagerUserId", inspector);

        postOrgUnit(body, manager())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ORGANIZATION_INVALID_ASSIGNEE"));
    }

    @Test
    void codeIsUniqueIgnoringCase() throws Exception {
        long companyId = createCompany("CTY-" + suffix);
        postOrgUnit(restaurant(companyId, "NH-" + suffix), manager()).andExpect(status().isCreated());

        postOrgUnit(restaurant(companyId, "nh-" + suffix.toLowerCase()), manager())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ORGANIZATION_CODE_TAKEN"));
    }

    @Test
    void departmentDropsRestaurantOnlyFields() throws Exception {
        long companyId = createCompany("CTY-" + suffix);
        Map<String, Object> body = restaurant(companyId, "PB-" + suffix);
        body.put("unitType", "DEPARTMENT");

        postOrgUnit(body, manager())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.latitude").value(nullValue()))
                .andExpect(jsonPath("$.checkinRadiusM").value(nullValue()));
    }

    @Test
    void inactiveCompanyCannotReceiveNewUnits() throws Exception {
        long companyId = createCompany("CTY-" + suffix);
        mvc.perform(put("/api/v1/companies/" + companyId).with(manager())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("code", "CTY-" + suffix, "name", "Công ty test", "active", false))))
                .andExpect(status().isOk());

        postOrgUnit(restaurant(companyId, "NH-" + suffix), manager())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ORGANIZATION_COMPANY_INACTIVE"));
    }

    @Test
    void validationErrorsAreInVietnamesePerField() throws Exception {
        mvc.perform(post("/api/v1/companies").with(manager())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("code", "mã có dấu", "name", "", "active", true))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.code").value("Mã chỉ gồm chữ không dấu, số, dấu gạch ngang hoặc gạch dưới"))
                .andExpect(jsonPath("$.errors.name").value("Vui lòng nhập tên công ty"));
    }

    @Test
    void readOnlyUserCannotWriteAndAnonymousIsRejected() throws Exception {
        JwtRequestPostProcessor reader = jwt().authorities(new SimpleGrantedAuthority(PermissionCodes.ORGANIZATION_READ));

        mvc.perform(get("/api/v1/org-units").with(reader)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/companies").with(reader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("code", "X" + suffix, "name", "X", "active", true))))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/companies")).andExpect(status().isUnauthorized());
    }

    @Test
    void listFiltersByTypeAndCompany() throws Exception {
        long companyId = createCompany("CTY-" + suffix);
        postOrgUnit(restaurant(companyId, "NH-" + suffix), manager()).andExpect(status().isCreated());
        Map<String, Object> dept = restaurant(companyId, "PB-" + suffix);
        dept.put("unitType", "DEPARTMENT");
        postOrgUnit(dept, manager()).andExpect(status().isCreated());

        mvc.perform(get("/api/v1/org-units").with(manager())
                        .param("companyId", String.valueOf(companyId))
                        .param("unitType", "RESTAURANT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(1))
                .andExpect(jsonPath("$.items[0].code").value("NH-" + suffix));
    }

    @Test
    void deleteCompanyWithoutUnitsSucceeds() throws Exception {
        long companyId = createCompany("CT-DEL-" + suffix);
        mvc.perform(delete("/api/v1/companies/{id}", companyId).with(manager()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/companies/{id}", companyId).with(manager()))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteCompanyWithUnitsFailsConflict() throws Exception {
        long companyId = createCompany("CT-BUSY-" + suffix);
        postOrgUnit(restaurant(companyId, "NH-BUSY-" + suffix), manager()).andExpect(status().isCreated());

        mvc.perform(delete("/api/v1/companies/{id}", companyId).with(manager()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));
    }

    @Test
    void deleteOrgUnitSucceeds() throws Exception {
        long companyId = createCompany("CT-U-" + suffix);
        String res = postOrgUnit(restaurant(companyId, "NH-DEL-" + suffix), manager())
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long unitId = jsonMapper.readTree(res).get("id").asLong();

        mvc.perform(delete("/api/v1/org-units/{id}", unitId).with(manager()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/org-units/{id}", unitId).with(manager()))
                .andExpect(status().isNotFound());
    }

    // ---- helpers ----

    private static JwtRequestPostProcessor manager() {
        return jwt().authorities(
                new SimpleGrantedAuthority(PermissionCodes.ORGANIZATION_READ),
                new SimpleGrantedAuthority(PermissionCodes.ORGANIZATION_MANAGE));
    }

    private long createCompany(String code) throws Exception {
        String res = mvc.perform(post("/api/v1/companies").with(manager())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("code", code, "name", "Công ty test", "active", true))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return jsonMapper.readTree(res).get("id").asLong();
    }

    private ResultActions postOrgUnit(Map<String, Object> body, JwtRequestPostProcessor auth) throws Exception {
        return mvc.perform(post("/api/v1/org-units").with(auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(body)));
    }

    private static Map<String, Object> restaurant(long companyId, String code) {
        Map<String, Object> m = new HashMap<>();
        m.put("companyId", companyId);
        m.put("unitType", "RESTAURANT");
        m.put("code", code);
        m.put("name", "Nhà hàng test");
        m.put("address", "1 Lê Lợi, Q1");
        m.put("latitude", 10.7769);
        m.put("longitude", 106.7009);
        m.put("checkinRadiusM", 100);
        m.put("active", true);
        return m;
    }

    private long insertUser(String prefix, String roleCode) {
        Long id = jdbc.queryForObject("""
                INSERT INTO users (username, password_hash, full_name) VALUES (?, '{noop}x', ?) RETURNING id
                """, Long.class, prefix + "_" + suffix.toLowerCase(), "Test " + prefix + " " + suffix);
        jdbc.update("INSERT INTO user_roles (user_id, role_id) SELECT ?, id FROM roles WHERE code = ?", id, roleCode);
        return id;
    }

    private String json(Object o) {
        return jsonMapper.writeValueAsString(o);
    }
}

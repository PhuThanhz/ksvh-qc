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
import java.util.List;
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
    void createsRestaurantWithGps() throws Exception {
        long companyId = createCompany("CTY-" + suffix);

        postOrgUnit(restaurant(companyId, "NH-" + suffix), manager())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.unitType").value("RESTAURANT"))
                .andExpect(jsonPath("$.companyCode").value("CTY-" + suffix))
                .andExpect(jsonPath("$.storeManager").value(nullValue()))
                .andExpect(jsonPath("$.checkinRadiusM").value(100));
    }

    @Test
    void assignsRestaurantsToUserAndUnitShowsTheirNames() throws Exception {
        long companyId = createCompany("CTY-" + suffix);
        long nh1 = createRestaurant(companyId, "NH1-" + suffix);
        long nh2 = createRestaurant(companyId, "NH2-" + suffix);
        long cht = insertUser("cht", RoleCodes.STORE_MANAGER);
        long obm = insertUser("obm", RoleCodes.OBM);

        putAssignment(cht, List.of(nh1, nh2), List.of())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.storeManagerOf.length()").value(2))
                .andExpect(jsonPath("$.obmOf.length()").value(0));
        putAssignment(obm, List.of(), List.of(nh1)).andExpect(status().isOk());

        mvc.perform(get("/api/v1/org-units/{id}", nh1).with(manager()))
                .andExpect(jsonPath("$.storeManager.fullName").value("Test cht " + suffix))
                .andExpect(jsonPath("$.obm.fullName").value("Test obm " + suffix));
        mvc.perform(get("/api/v1/org-units/assignments/{id}", cht).with(manager()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.storeManagerOf[0].code").value("NH1-" + suffix));
    }

    @Test
    void reassigningMovesRestaurantFromPreviousManagerAndUncheckedOnesAreCleared() throws Exception {
        long companyId = createCompany("CTY-" + suffix);
        long nh1 = createRestaurant(companyId, "NH1-" + suffix);
        long nh2 = createRestaurant(companyId, "NH2-" + suffix);
        long chtA = insertUser("chta", RoleCodes.STORE_MANAGER);
        long chtB = insertUser("chtb", RoleCodes.STORE_MANAGER);

        putAssignment(chtA, List.of(nh1, nh2), List.of()).andExpect(status().isOk());
        // B nhận NH1 → NH1 chuyển từ A sang B.
        putAssignment(chtB, List.of(nh1), List.of()).andExpect(status().isOk());
        mvc.perform(get("/api/v1/org-units/assignments/{id}", chtA).with(manager()))
                .andExpect(jsonPath("$.storeManagerOf.length()").value(1))
                .andExpect(jsonPath("$.storeManagerOf[0].id").value(nh2));

        // A bỏ chọn hết → NH2 không còn CHT.
        putAssignment(chtA, List.of(), List.of()).andExpect(status().isOk());
        mvc.perform(get("/api/v1/org-units/{id}", nh2).with(manager()))
                .andExpect(jsonPath("$.storeManager").value(nullValue()));
    }

    @Test
    void editingRestaurantKeepsItsAssignees() throws Exception {
        long companyId = createCompany("CTY-" + suffix);
        long nh = createRestaurant(companyId, "NH-" + suffix);
        long cht = insertUser("cht", RoleCodes.STORE_MANAGER);
        putAssignment(cht, List.of(nh), List.of()).andExpect(status().isOk());

        Map<String, Object> body = restaurant(companyId, "NH-" + suffix);
        body.put("name", "Tên mới");
        mvc.perform(put("/api/v1/org-units/{id}", nh).with(manager())
                        .contentType(MediaType.APPLICATION_JSON).content(json(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.storeManager.fullName").value("Test cht " + suffix));
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
    void assigneeMustHaveMatchingRoleAndTargetsMustBeRestaurants() throws Exception {
        long companyId = createCompany("CTY-" + suffix);
        long nh = createRestaurant(companyId, "NH-" + suffix);
        Map<String, Object> dept = restaurant(companyId, "PB-" + suffix);
        dept.put("unitType", "DEPARTMENT");
        long pb = jsonMapper.readTree(postOrgUnit(dept, manager()).andReturn().getResponse().getContentAsString())
                .get("id").asLong();
        long inspector = insertUser("cv", RoleCodes.KSVH_INSPECTOR);
        long cht = insertUser("cht", RoleCodes.STORE_MANAGER);

        putAssignment(inspector, List.of(nh), List.of())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ORGANIZATION_INVALID_ASSIGNEE"));
        putAssignment(cht, List.of(), List.of(nh))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ORGANIZATION_INVALID_ASSIGNEE"));
        putAssignment(cht, List.of(pb), List.of())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ORGANIZATION_NOT_RESTAURANT"));
        // Người không có vai trò vẫn được gửi danh sách rỗng (bỏ gán hết).
        putAssignment(inspector, List.of(), List.of()).andExpect(status().isOk());
    }

    @Test
    void assignmentNeedsManagePermission() throws Exception {
        long cht = insertUser("cht", RoleCodes.STORE_MANAGER);
        mvc.perform(put("/api/v1/org-units/assignments/{id}", cht)
                        .with(jwt().authorities(new SimpleGrantedAuthority(PermissionCodes.ORGANIZATION_READ)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("storeManagerRestaurantIds", List.of(), "obmRestaurantIds", List.of()))))
                .andExpect(status().isForbidden());
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

    private long createRestaurant(long companyId, String code) throws Exception {
        String res = postOrgUnit(restaurant(companyId, code), manager())
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return jsonMapper.readTree(res).get("id").asLong();
    }

    private ResultActions putAssignment(long userId, List<Long> chtOf, List<Long> obmOf) throws Exception {
        return mvc.perform(put("/api/v1/org-units/assignments/{id}", userId).with(manager())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("storeManagerRestaurantIds", chtOf, "obmRestaurantIds", obmOf))));
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

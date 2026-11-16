package vn.ksvh.qc.criteria;

import org.junit.jupiter.api.Test;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.support.ApiTestSupport;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Danh mục 5–9: nhóm tiêu chí, tiêu chí, mẫu phiếu, mức rủi ro, tần suất, nâng mức. */
class CriteriaCatalogApiTests extends ApiTestSupport {

    private static final String[] MANAGE = {PermissionCodes.CRITERIA_READ, PermissionCodes.CRITERIA_MANAGE};
    private static final LocalDate TODAY = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));

    // ---- Nhóm & tiêu chí ----

    @Test
    void createsGroupAndCriterionAndListsByGroup() throws Exception {
        long group = createGroup("VS-" + suffix, true);
        long criterion = createCriterion(group, "VS-" + suffix + ".01", 3);

        mvc.perform(get("/api/v1/criteria").param("groupId", String.valueOf(group)).with(as(1L, MANAGE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(1))
                .andExpect(jsonPath("$.items[0].id").value(criterion))
                .andExpect(jsonPath("$.items[0].baseImpact").value(3))
                .andExpect(jsonPath("$.items[0].groupName").value("Nhóm " + suffix));

        mvc.perform(get("/api/v1/criterion-groups").with(as(1L, MANAGE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + group + ")].criterionCount").value(1));
    }

    @Test
    void impactMustBeOneToFiveAndCodesUnique() throws Exception {
        long group = createGroup("G-" + suffix, true);
        mvc.perform(withJson(post("/api/v1/criteria"), criterion(group, "C-" + suffix, 6)).with(as(1L, MANAGE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.baseImpact").value("Mức ảnh hưởng từ 1 đến 5"));

        createCriterion(group, "C-" + suffix, 1);
        mvc.perform(withJson(post("/api/v1/criteria"), criterion(group, "c-" + suffix, 1)).with(as(1L, MANAGE)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CRITERIA_CODE_TAKEN"));
    }

    @Test
    void cannotAddCriterionToInactiveGroup() throws Exception {
        long group = createGroup("OFF-" + suffix, false);
        mvc.perform(withJson(post("/api/v1/criteria"), criterion(group, "X-" + suffix, 1)).with(as(1L, MANAGE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CRITERIA_INVALID_REFERENCE"));
    }

    // ---- Mẫu phiếu ----

    @Test
    void templateKeepsCriterionOrderAndRejectsInactiveOrDuplicate() throws Exception {
        long group = createGroup("T-" + suffix, true);
        long a = createCriterion(group, "A-" + suffix, 1);
        long b = createCriterion(group, "B-" + suffix, 2);
        long off = createCriterion(group, "OFF-" + suffix, 2);
        Map<String, Object> deactivate = criterion(group, "OFF-" + suffix, 2);
        deactivate.put("active", false);
        mvc.perform(withJson(put("/api/v1/criteria/" + off), deactivate).with(as(1L, MANAGE))).andExpect(status().isOk());

        Map<String, Object> body = template("MP-" + suffix, List.of(b, a));
        String res = mvc.perform(withJson(post("/api/v1/inspection-templates"), body).with(as(1L, MANAGE)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.criterionCount").value(2))
                .andExpect(jsonPath("$.criteria[0].id").value(b))
                .andExpect(jsonPath("$.criteria[1].id").value(a))
                .andReturn().getResponse().getContentAsString();
        long id = read(res).get("id").asLong();

        mvc.perform(withJson(put("/api/v1/inspection-templates/" + id), template("MP-" + suffix, List.of(a, off)))
                        .with(as(1L, MANAGE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CRITERIA_INVALID_REFERENCE"));

        mvc.perform(withJson(put("/api/v1/inspection-templates/" + id), template("MP-" + suffix, List.of(a, a)))
                        .with(as(1L, MANAGE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CRITERIA_INVALID_REFERENCE"));
    }

    @Test
    void criterionInTemplateCannotBeDeletedButUnusedCan() throws Exception {
        long group = createGroup("DEL-" + suffix, true);
        long used = createCriterion(group, "U-" + suffix, 1);
        long unused = createCriterion(group, "N-" + suffix, 1);
        mvc.perform(withJson(post("/api/v1/inspection-templates"), template("MPD-" + suffix, List.of(used))).with(as(1L, MANAGE)))
                .andExpect(status().isCreated());

        mvc.perform(delete("/api/v1/criteria/" + used).with(as(1L, MANAGE)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CRITERIA_IN_USE"));
        mvc.perform(delete("/api/v1/criteria/" + unused).with(as(1L, MANAGE)))
                .andExpect(status().isNoContent());
    }

    @Test
    void companyGroupCriteriaOnlyInSameCompanyTemplates() throws Exception {
        long companyA = jdbc.queryForObject("INSERT INTO companies(code, name, active) VALUES (?, ?, true) RETURNING id",
                Long.class, "CA-" + suffix, "Công ty A");
        long companyB = jdbc.queryForObject("INSERT INTO companies(code, name, active) VALUES (?, ?, true) RETURNING id",
                Long.class, "CB-" + suffix, "Công ty B");
        long group = createGroup("CG-" + suffix, true);
        long c = createCriterion(group, "CC-" + suffix, 1);
        Map<String, Object> groupBody = Map.of("code", "CG-" + suffix, "name", "Nhóm " + suffix, "sortOrder", 1,
                "active", true, "companyId", companyA);

        // Mẫu dùng chung đang chứa tiêu chí → không được gán nhóm cho riêng công ty A
        mvc.perform(withJson(post("/api/v1/inspection-templates"), template("SH-" + suffix, List.of(c))).with(as(1L, MANAGE)))
                .andExpect(status().isCreated());
        mvc.perform(withJson(put("/api/v1/criterion-groups/" + group), groupBody).with(as(1L, MANAGE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CRITERIA_INVALID_REFERENCE"));

        long groupA = jdbc.queryForObject("INSERT INTO criterion_groups(code, name, company_id) VALUES (?, ?, ?) RETURNING id",
                Long.class, "GA-" + suffix, "Nhóm A", companyA);
        long ca = createCriterion(groupA, "CA-" + suffix, 1);
        Map<String, Object> tplB = template("TB-" + suffix, List.of(ca));
        tplB.put("companyId", companyB);
        mvc.perform(withJson(post("/api/v1/inspection-templates"), tplB).with(as(1L, MANAGE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CRITERIA_INVALID_REFERENCE"));
        Map<String, Object> tplA = template("TA-" + suffix, List.of(ca));
        tplA.put("companyId", companyA);
        mvc.perform(withJson(post("/api/v1/inspection-templates"), tplA).with(as(1L, MANAGE)))
                .andExpect(status().isCreated());

        // Giao diện cần biết công ty của nhóm để lọc tiêu chí, và cần đủ danh sách mẫu (không phân trang)
        mvc.perform(get("/api/v1/criteria/" + ca).with(as(1L, PermissionCodes.CRITERIA_READ)))
                .andExpect(jsonPath("$.groupCompanyId").value(companyA));
        mvc.perform(get("/api/v1/inspection-templates/options").with(as(1L, PermissionCodes.CRITERIA_READ)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.code == 'TA-" + suffix + "')].companyId").value(org.hamcrest.Matchers.contains((int) companyA)));
    }

    // ---- Mức rủi ro ----

    @Test
    void seededRiskLevelsFollowPdfExample() throws Exception {
        mvc.perform(get("/api/v1/risk-levels").with(as(1L, PermissionCodes.CRITERIA_READ)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[1].code").value("M2"))
                .andExpect(jsonPath("$[1].minScore").value(1))
                .andExpect(jsonPath("$[1].maxScore").value(6))
                .andExpect(jsonPath("$[2].remediationDays").value(7))
                .andExpect(jsonPath("$[3].maxScore").doesNotExist());
    }

    @Test
    void replacesRiskLevelsWhenContiguous() throws Exception {
        List<Map<String, Object>> levels = List.of(
                level("L1", 0, 4, 30), level("L2", 4, 10, 7), level("L3", 10, null, 1));
        mvc.perform(withJson(put("/api/v1/risk-levels"), version(TODAY, levels)).with(as(1L, MANAGE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CURRENT"))
                .andExpect(jsonPath("$.levels.length()").value(3))
                .andExpect(jsonPath("$.levels[2].code").value("L3"));
        mvc.perform(get("/api/v1/risk-levels").with(as(1L, PermissionCodes.CRITERIA_READ)))
                .andExpect(jsonPath("$.length()").value(3));
    }

    @Test
    void riskLevelVersionsAreScheduledNotBackdated() throws Exception {
        List<Map<String, Object>> levels = List.of(level("L1", 0, 5, 30), level("L2", 5, null, 3));
        mvc.perform(withJson(put("/api/v1/risk-levels"), version(TODAY.minusDays(1), levels)).with(as(1L, MANAGE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CONFIG_EFFECTIVE_DATE_INVALID"));

        LocalDate future = TODAY.plusDays(15);
        mvc.perform(withJson(put("/api/v1/risk-levels"), version(future, levels)).with(as(1L, MANAGE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SCHEDULED"));

        // Bảng đang áp dụng vẫn là bản cũ (4 mức) cho tới ngày hiệu lực
        mvc.perform(get("/api/v1/risk-levels").with(as(1L, PermissionCodes.CRITERIA_READ)))
                .andExpect(jsonPath("$.length()").value(4));
        mvc.perform(get("/api/v1/risk-levels/versions").with(as(1L, PermissionCodes.CRITERIA_READ)))
                .andExpect(jsonPath("$[0].status").value("SCHEDULED"))
                .andExpect(jsonPath("$[1].status").value("CURRENT"));

        String current = jdbc.queryForObject("SELECT max(effective_from)::text FROM risk_levels WHERE effective_from <= ?",
                String.class, java.sql.Date.valueOf(TODAY));
        mvc.perform(delete("/api/v1/risk-levels/versions/" + current).with(as(1L, MANAGE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CONFIG_ALREADY_EFFECTIVE"));
        mvc.perform(delete("/api/v1/risk-levels/versions/" + future).with(as(1L, MANAGE)))
                .andExpect(status().isNoContent());
    }

    @Test
    void rejectsGapOverlapAndBoundedTopLevel() throws Exception {
        expectInvalidLevels(List.of(level("L1", 0, 4, 30), level("L2", 5, null, 7)), "liền nhau");
        expectInvalidLevels(List.of(level("L1", 0, 6, 30), level("L2", 4, null, 7)), "liền nhau");
        expectInvalidLevels(List.of(level("L1", 0, 4, 30), level("L2", 4, 20, 7)), "không có giới hạn trên");
        expectInvalidLevels(List.of(level("L1", 1, null, 30)), "bắt đầu từ 0");
    }

    // ---- Tần suất & nâng mức ----

    @Test
    void frequencyVersionsCannotBeBackdatedAndOnlyScheduledCanBeDeleted() throws Exception {
        mvc.perform(withJson(post("/api/v1/frequency-configs"),
                        Map.of("periodMonths", 3, "effectiveFrom", TODAY.minusDays(1).toString())).with(as(1L, MANAGE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CONFIG_EFFECTIVE_DATE_INVALID"));

        mvc.perform(withJson(post("/api/v1/frequency-configs"),
                        Map.of("periodMonths", 4, "effectiveFrom", TODAY.plusDays(30).toString())).with(as(1L, MANAGE)))
                .andExpect(status().isBadRequest());

        String res = mvc.perform(withJson(post("/api/v1/frequency-configs"),
                        Map.of("periodMonths", 3, "effectiveFrom", TODAY.plusDays(30).toString())).with(as(1L, MANAGE)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andReturn().getResponse().getContentAsString();
        long scheduled = read(res).get("id").asLong();

        Long current = jdbc.queryForObject(
                "SELECT id FROM frequency_configs WHERE effective_from <= ? ORDER BY effective_from DESC LIMIT 1",
                Long.class, java.sql.Date.valueOf(TODAY));
        mvc.perform(delete("/api/v1/frequency-configs/" + current).with(as(1L, MANAGE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CONFIG_ALREADY_EFFECTIVE"));
        mvc.perform(delete("/api/v1/frequency-configs/" + scheduled).with(as(1L, MANAGE)))
                .andExpect(status().isNoContent());
    }

    @Test
    void escalationRuleListMarksCurrentVersion() throws Exception {
        mvc.perform(withJson(post("/api/v1/escalation-rules"), Map.of("thresholdCount", 4, "stepIncrease", 1,
                        "maxImpact", 5, "resetPeriodMonths", 6, "effectiveFrom", TODAY.plusDays(10).toString()))
                        .with(as(1L, MANAGE)))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/v1/escalation-rules").with(as(1L, PermissionCodes.CRITERIA_READ)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("SCHEDULED"))
                .andExpect(jsonPath("$[1].status").value("CURRENT"))
                .andExpect(jsonPath("$[1].thresholdCount").value(3));

        mvc.perform(withJson(post("/api/v1/escalation-rules"), Map.of("thresholdCount", 3, "stepIncrease", 1,
                        "maxImpact", 6, "resetPeriodMonths", 6, "effectiveFrom", TODAY.plusDays(20).toString()))
                        .with(as(1L, MANAGE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.maxImpact").value("Mức trần từ 1 đến 5"));
    }

    @Test
    void readOnlyCannotWrite() throws Exception {
        mvc.perform(withJson(post("/api/v1/criterion-groups"), Map.of("code", "X" + suffix, "name", "X",
                        "sortOrder", 1, "active", true)).with(as(1L, PermissionCodes.CRITERIA_READ)))
                .andExpect(status().isForbidden());
        mvc.perform(withJson(put("/api/v1/risk-levels"), version(TODAY, List.of(level("L1", 0, null, 1))))
                        .with(as(1L, PermissionCodes.CRITERIA_READ)))
                .andExpect(status().isForbidden());
    }

    // ---- helpers ----

    private long createGroup(String code, boolean active) throws Exception {
        String res = mvc.perform(withJson(post("/api/v1/criterion-groups"),
                        Map.of("code", code, "name", "Nhóm " + suffix, "sortOrder", 1, "active", active))
                        .with(as(1L, MANAGE)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return read(res).get("id").asLong();
    }

    private long createCriterion(long group, String code, int impact) throws Exception {
        String res = mvc.perform(withJson(post("/api/v1/criteria"), criterion(group, code, impact)).with(as(1L, MANAGE)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return read(res).get("id").asLong();
    }

    private static Map<String, Object> criterion(long group, String code, int impact) {
        Map<String, Object> m = new HashMap<>();
        m.put("groupId", group);
        m.put("code", code);
        m.put("name", "Bàn ghế bụi");
        m.put("checkMethod", "Quan sát, dùng khăn trắng lau thử");
        m.put("evidenceRequired", "Ảnh chụp bề mặt");
        m.put("baseImpact", impact);
        m.put("sortOrder", 1);
        m.put("active", true);
        return m;
    }

    private static Map<String, Object> template(String code, List<Long> criterionIds) {
        Map<String, Object> m = new HashMap<>();
        m.put("code", code);
        m.put("name", "Mẫu kiểm tra định kỳ");
        m.put("restaurantType", "Buffet");
        m.put("inspectionType", "Định kỳ");
        m.put("criterionIds", criterionIds);
        m.put("active", true);
        return m;
    }

    private static Map<String, Object> version(LocalDate effectiveFrom, List<Map<String, Object>> levels) {
        return Map.of("effectiveFrom", effectiveFrom.toString(), "levels", levels);
    }

    private static Map<String, Object> level(String code, int min, Integer max, int days) {
        Map<String, Object> m = new HashMap<>();
        m.put("code", code);
        m.put("name", "Mức " + code);
        m.put("minScore", min);
        m.put("maxScore", max);
        m.put("remediationDays", days);
        return m;
    }

    private void expectInvalidLevels(List<Map<String, Object>> levels, String messagePart) throws Exception {
        mvc.perform(withJson(put("/api/v1/risk-levels"), version(TODAY, new ArrayList<>(levels))).with(as(1L, MANAGE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("RISK_LEVELS_INVALID"))
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString(messagePart)));
    }
}

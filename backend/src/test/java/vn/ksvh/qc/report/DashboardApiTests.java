package vn.ksvh.qc.report;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.support.ApiTestSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Số liệu trang Tổng quan: so sánh trước / sau khi thêm dữ liệu (DB dev có thể đã có dữ liệu khác). */
class DashboardApiTests extends ApiTestSupport {

    private JsonNode dashboard() throws Exception {
        return read(mvc.perform(get("/api/v1/reports/dashboard").with(as(1L, PermissionCodes.REPORT_READ)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
    }

    @Test
    void countsSubmittedInspectionsAndOpenOverdueFindings() throws Exception {
        JsonNode before = dashboard();
        assertThat(before.get("trend").size()).isEqualTo(6);
        assertThat(before.get("findingsByStatus").size()).isEqualTo(7);

        long inspector = insertUser("dash_" + suffix, RoleCodes.KSVH_INSPECTOR);
        long company = jdbc.queryForObject("INSERT INTO companies(code, name) VALUES (?, 'C') RETURNING id", Long.class, "DC-" + suffix);
        long store = jdbc.queryForObject("INSERT INTO org_units(company_id, code, name, unit_type, latitude, longitude, checkin_radius_m) VALUES (?, ?, 'NH dash', 'RESTAURANT', 10.7, 106.6, 150) RETURNING id",
                Long.class, company, "DNH-" + suffix);
        long group = jdbc.queryForObject("INSERT INTO criterion_groups(code, name) VALUES (?, 'G') RETURNING id", Long.class, "DG-" + suffix);
        long crit = jdbc.queryForObject("INSERT INTO criteria(group_id, code, name, base_impact) VALUES (?, ?, 'Bụi', 3) RETURNING id",
                Long.class, group, "DCR-" + suffix);
        long tpl = jdbc.queryForObject("INSERT INTO inspection_templates(code, name) VALUES (?, 'T') RETURNING id", Long.class, "DT-" + suffix);
        long ins = jdbc.queryForObject("""
                INSERT INTO inspections(code, restaurant_id, template_id, inspector_id, status, submitted_at)
                VALUES (?, ?, ?, ?, 'SUBMITTED', now()) RETURNING id""", Long.class, "DI-" + suffix, store, tpl, inspector);
        long item = jdbc.queryForObject("""
                INSERT INTO inspection_items(inspection_id, criterion_id, criterion_code, criterion_name, base_impact, result)
                VALUES (?, ?, 'X', 'Bụi', 3, 'FAIL') RETURNING id""", Long.class, ins, crit);
        jdbc.update("""
                INSERT INTO findings(inspection_id, inspection_item_id, restaurant_id, criterion_id, base_impact, effective_impact, violation_count,
                                     calculated_score, risk_level_code, risk_level_name, deadline_date, status, description)
                VALUES (?, ?, ?, ?, 3, 3, 3, 9, 'M3', 'Cao', current_date - 2, 'CONFIRMED', 'Lỗi quá hạn')""", ins, item, store, crit);

        JsonNode after = dashboard();
        JsonNode k0 = before.get("kpis"), k1 = after.get("kpis");
        assertThat(k1.get("inspectionsThisMonth").asLong()).isEqualTo(k0.get("inspectionsThisMonth").asLong() + 1);
        assertThat(k1.get("openFindings").asLong()).isEqualTo(k0.get("openFindings").asLong() + 1);
        assertThat(k1.get("overdueFindings").asLong()).isEqualTo(k0.get("overdueFindings").asLong() + 1);
        assertThat(after.get("trend").get(5).get("findings").asLong())
                .isEqualTo(before.get("trend").get(5).get("findings").asLong() + 1);
        boolean listed = false;
        for (JsonNode r : after.get("topRestaurants")) {
            if (r.get("id").asLong() == store) {
                listed = true;
                assertThat(r.get("riskScore").asLong()).isEqualTo(9);
            }
        }
        assertThat(listed).isTrue();
    }

    @Test
    void requiresReportOrInspectionReadAll() throws Exception {
        mvc.perform(get("/api/v1/reports/dashboard").with(as(1L, PermissionCodes.USER_READ)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/reports/dashboard").param("months", "24").with(as(1L, PermissionCodes.REPORT_READ)))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/reports/dashboard").with(as(1L, PermissionCodes.INSPECTION_READ_ALL)))
                .andExpect(jsonPath("$.kpis").exists());
    }

    @Test
    void approvalQueueReturnsPendingPlansAndAppealMeetings() throws Exception {
        mvc.perform(get("/api/v1/reports/approval-queue").with(as(1L, PermissionCodes.REPORT_READ)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pendingPlans").isArray())
                .andExpect(jsonPath("$.appealMeetings").isArray());
    }
}

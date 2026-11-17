package vn.ksvh.qc.report;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.support.ApiTestSupport;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ReportApiTests extends ApiTestSupport {

    private long inspectorId;
    private long companyId;
    private long storeId;
    private long groupId;
    private long crit1Id;
    private long crit2Id;
    private long templateId;
    private long inspectionId;
    private long m4FindingId;

    private static final String[] REPORT_PERMS = {
            PermissionCodes.REPORT_READ,
            PermissionCodes.REPORT_EXPORT,
            PermissionCodes.INSPECTION_READ_ALL,
            PermissionCodes.FINDING_RESPOND
    };

    @BeforeEach
    void setupTestData() {
        inspectorId = insertUser("insp_" + suffix, RoleCodes.KSVH_INSPECTOR);
        companyId = jdbc.queryForObject("INSERT INTO companies(code, name) VALUES (?, 'C') RETURNING id",
                Long.class, "RC-" + suffix);
        storeId = jdbc.queryForObject("""
                INSERT INTO org_units(company_id, code, name, unit_type, latitude, longitude, checkin_radius_m)
                VALUES (?, ?, 'NH Report', 'RESTAURANT', 10.7, 106.6, 150) RETURNING id""",
                Long.class, companyId, "RNH-" + suffix);
        groupId = jdbc.queryForObject("INSERT INTO criterion_groups(code, name) VALUES (?, 'G') RETURNING id",
                Long.class, "RG-" + suffix);
        crit1Id = jdbc.queryForObject("""
                INSERT INTO criteria(group_id, code, name, base_impact)
                VALUES (?, ?, 'Vệ sinh sàn', 2) RETURNING id""",
                Long.class, groupId, "CR1-" + suffix);
        crit2Id = jdbc.queryForObject("""
                INSERT INTO criteria(group_id, code, name, base_impact)
                VALUES (?, ?, 'Hạn sử dụng thực phẩm', 5) RETURNING id""",
                Long.class, groupId, "CR2-" + suffix);
        templateId = jdbc.queryForObject("INSERT INTO inspection_templates(code, name) VALUES (?, 'T') RETURNING id",
                Long.class, "RT-" + suffix);

        inspectionId = jdbc.queryForObject("""
                INSERT INTO inspections(code, restaurant_id, template_id, inspector_id, inspection_type, status,
                                        checkin_lat, checkin_lng, checkin_distance_m, checkin_at, submitted_at, completed_at)
                VALUES (?, ?, ?, ?, 'PERIODIC', 'COMPLETED', 10.7, 106.6, 15.0, now(), now(), now()) RETURNING id""",
                Long.class, "RI-" + suffix, storeId, templateId, inspectorId);

        long item1 = jdbc.queryForObject("""
                INSERT INTO inspection_items(inspection_id, criterion_id, criterion_code, criterion_name, group_name, base_impact, result, sort_order)
                VALUES (?, ?, 'CR1', 'Vệ sinh sàn', 'Vệ sinh', 2, 'PASS', 1) RETURNING id""",
                Long.class, inspectionId, crit1Id);

        long item2 = jdbc.queryForObject("""
                INSERT INTO inspection_items(inspection_id, criterion_id, criterion_code, criterion_name, group_name, base_impact, result, sort_order)
                VALUES (?, ?, 'CR2', 'Hạn sử dụng thực phẩm', 'An toàn', 5, 'FAIL', 2) RETURNING id""",
                Long.class, inspectionId, crit2Id);

        m4FindingId = jdbc.queryForObject("""
                INSERT INTO findings(inspection_id, inspection_item_id, restaurant_id, criterion_id, base_impact, effective_impact,
                                     violation_count, calculated_score, risk_level_code, risk_level_name, deadline_date, status, description)
                VALUES (?, ?, ?, ?, 5, 5, 1, 20, 'M4', 'Đặc biệt nghiêm trọng', current_date + 1, 'OPEN', 'Thịt quá hạn sử dụng 3 ngày') RETURNING id""",
                Long.class, inspectionId, item2, storeId, crit2Id);
    }

    @Test
    void testMonthlySummaryAndExcelExport() throws Exception {
        mvc.perform(get("/api/v1/reports/monthly-summary").with(as(1L, REPORT_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.summary").isMap())
                .andExpect(jsonPath("$.summary.totalInspections").isNumber());

        byte[] excel = mvc.perform(get("/api/v1/reports/monthly-summary/export-excel").with(as(1L, REPORT_PERMS)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(excel).isNotEmpty();
    }

    @Test
    void testRestaurantRankingsAndExcelExport() throws Exception {
        mvc.perform(get("/api/v1/reports/restaurant-rankings").with(as(1L, REPORT_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items[?(@.restaurantId == " + storeId + ")].restaurantCode").value("RNH-" + suffix))
                .andExpect(jsonPath("$.items[?(@.restaurantId == " + storeId + ")].m4Count").value(1));

        byte[] excel = mvc.perform(get("/api/v1/reports/restaurant-rankings/export-excel").with(as(1L, REPORT_PERMS)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(excel).isNotEmpty();
    }

    @Test
    void testCriteriaViolationsAndExcelExport() throws Exception {
        mvc.perform(get("/api/v1/reports/criteria-violations").with(as(1L, REPORT_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.totalViolations").isNumber());

        byte[] excel = mvc.perform(get("/api/v1/reports/criteria-violations/export-excel").with(as(1L, REPORT_PERMS)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(excel).isNotEmpty();
    }

    @Test
    void testRemediationStatusAndExcelExport() throws Exception {
        mvc.perform(get("/api/v1/reports/remediations").with(as(1L, REPORT_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.summary").isMap());

        byte[] excel = mvc.perform(get("/api/v1/reports/remediations/export-excel").with(as(1L, REPORT_PERMS)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(excel).isNotEmpty();
    }

    @Test
    void testInspectorProductivityAndExcelExport() throws Exception {
        mvc.perform(get("/api/v1/reports/inspector-productivity").with(as(1L, REPORT_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray());

        byte[] excel = mvc.perform(get("/api/v1/reports/inspector-productivity/export-excel").with(as(1L, REPORT_PERMS)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(excel).isNotEmpty();
    }

    @Test
    void testInspectionPdfExport() throws Exception {
        byte[] pdf = mvc.perform(get("/api/v1/reports/inspections/" + inspectionId + "/export-pdf").with(as(1L, REPORT_PERMS)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andReturn().getResponse().getContentAsByteArray();

        assertThat(pdf).isNotEmpty();
        String headerStr = new String(pdf, 0, Math.min(pdf.length, 5), StandardCharsets.US_ASCII);
        assertThat(headerStr).startsWith("%PDF");
    }

    @Test
    void testM4AlertPdfExport() throws Exception {
        byte[] pdf = mvc.perform(get("/api/v1/reports/findings/" + m4FindingId + "/export-m4-pdf").with(as(1L, REPORT_PERMS)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andReturn().getResponse().getContentAsByteArray();

        assertThat(pdf).isNotEmpty();
        String headerStr = new String(pdf, 0, Math.min(pdf.length, 5), StandardCharsets.US_ASCII);
        assertThat(headerStr).startsWith("%PDF");
    }

    @Test
    void testAccessControlDeniedWithoutPermission() throws Exception {
        mvc.perform(get("/api/v1/reports/monthly-summary").with(as(1L, "unrelated:perm")))
                .andExpect(status().isForbidden());
    }

    private long insertUser(String prefix, String roleCode) {
        Long id = jdbc.queryForObject("""
                INSERT INTO users (username, password_hash, full_name, active) VALUES (?, '{noop}x', ?, true) RETURNING id
                """, Long.class, prefix + "_" + suffix.toLowerCase(), "Test " + prefix + " " + suffix);
        jdbc.update("INSERT INTO user_roles (user_id, role_id) SELECT ?, id FROM roles WHERE code = ?", id, roleCode);
        return id;
    }
}

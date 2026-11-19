package vn.ksvh.qc.inspection;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.support.ApiTestSupport;

import java.sql.Timestamp;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RestaurantRiskProfileApiTests extends ApiTestSupport {

    private long userId;
    private long companyId;
    private long restaurantId;
    private long groupId;
    private long criterionId;

    private static final String[] PERMS = {
            PermissionCodes.INSPECTION_READ_ALL,
            PermissionCodes.REPORT_READ
    };

    @BeforeEach
    void setupData() {
        userId = insertUser("lead_" + suffix, RoleCodes.KSVH_LEAD);
        companyId = jdbc.queryForObject("INSERT INTO companies(code, name) VALUES (?, 'Test Company') RETURNING id",
                Long.class, "COMP-" + suffix);
        restaurantId = jdbc.queryForObject("""
                INSERT INTO org_units(company_id, code, name, unit_type, latitude, longitude, checkin_radius_m)
                VALUES (?, ?, 'NH Test Risk', 'RESTAURANT', 10.7, 106.6, 150) RETURNING id""",
                Long.class, companyId, "REST-" + suffix);
        groupId = jdbc.queryForObject("INSERT INTO criterion_groups(code, name) VALUES (?, 'Group A') RETURNING id",
                Long.class, "GRP-" + suffix);
        // Base impact 1, threshold 3 to escalate to 2
        criterionId = jdbc.queryForObject("""
                INSERT INTO criteria(group_id, code, name, base_impact)
                VALUES (?, ?, 'Bàn ghế bụi', 1) RETURNING id""",
                Long.class, groupId, "CRIT-" + suffix);

        jdbc.update("INSERT INTO impact_escalation_rules (threshold_count, step_increase, max_impact, reset_period_months, effective_from, note) VALUES (3, 1, 5, 6, '2025-01-01', 'Test') ON CONFLICT (effective_from) DO NOTHING");
        jdbc.update("INSERT INTO frequency_configs (period_months, effective_from, note) VALUES (6, '2025-01-01', 'Test') ON CONFLICT (effective_from) DO NOTHING");
    }

    @Test
    void riskProfile_whenNoViolations_returnsBaseImpact() throws Exception {
        mvc.perform(get("/api/v1/restaurants/{id}/risk-profile", restaurantId)
                        .with(as(userId, PERMS)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.restaurantId").value(restaurantId))
                .andExpect(jsonPath("$.restaurantCode").value("REST-" + suffix))
                .andExpect(jsonPath("$.totalEscalatedCriteria").value(0))
                .andExpect(jsonPath("$.totalActiveFindings").value(0));
    }

    @Test
    void riskProfile_whenEscalated_returnsEffectiveImpactAndResetDate() throws Exception {
        // Tạo 3 occurrences trong 3 tháng liên tiếp (T1, T2, T3 của 2026)
        Timestamp t1 = Timestamp.valueOf(LocalDate.of(2026, 1, 10).atStartOfDay());
        Timestamp t2 = Timestamp.valueOf(LocalDate.of(2026, 2, 10).atStartOfDay());
        Timestamp t3 = Timestamp.valueOf(LocalDate.of(2026, 3, 10).atStartOfDay());

        jdbc.update("INSERT INTO finding_occurrences(restaurant_id, criterion_id, source, occurred_at) VALUES (?, ?, 'CONFIRMED', ?)",
                restaurantId, criterionId, t1);
        jdbc.update("INSERT INTO finding_occurrences(restaurant_id, criterion_id, source, occurred_at) VALUES (?, ?, 'CONFIRMED', ?)",
                restaurantId, criterionId, t2);
        jdbc.update("INSERT INTO finding_occurrences(restaurant_id, criterion_id, source, occurred_at) VALUES (?, ?, 'CONFIRMED', ?)",
                restaurantId, criterionId, t3);

        // Xem hồ sơ rủi ro tại thời điểm ngày 15/05/2026 (T5, đang trong kỳ 6 tháng sạch T4..T9, chưa đủ 6 tháng)
        mvc.perform(get("/api/v1/restaurants/{id}/risk-profile", restaurantId)
                        .param("asOfDate", "2026-05-15")
                        .with(as(userId, PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEscalatedCriteria").value(1))
                .andExpect(jsonPath("$.criteria[0].criterionId").value(criterionId))
                .andExpect(jsonPath("$.criteria[0].baseImpact").value(1))
                .andExpect(jsonPath("$.criteria[0].effectiveImpact").value(2))
                .andExpect(jsonPath("$.criteria[0].isEscalated").value(true))
                .andExpect(jsonPath("$.criteria[0].expectedResetDate").value("2026-10-01"))
                .andExpect(jsonPath("$.criteria[0].occurrences.length()").value(3));

        // Kiểm tra API danh sách điểm nóng nâng mức toàn hệ thống
        mvc.perform(get("/api/v1/risk/escalated-criteria")
                        .param("asOfDate", "2026-05-15")
                        .with(as(userId, PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.restaurantId == " + restaurantId + ")].effectiveImpact").value(2))
                .andExpect(jsonPath("$[?(@.restaurantId == " + restaurantId + ")].expectedResetDate").value("2026-10-01"));

        // Tại ngày 05/10/2026 (T10, đã qua 6 tháng sạch T4..T9) -> phải tự động hạ mức về 1
        mvc.perform(get("/api/v1/restaurants/{id}/risk-profile", restaurantId)
                        .param("asOfDate", "2026-10-05")
                        .with(as(userId, PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEscalatedCriteria").value(0))
                .andExpect(jsonPath("$.criteria[0].effectiveImpact").value(1))
                .andExpect(jsonPath("$.criteria[0].isEscalated").value(false))
                .andExpect(jsonPath("$.criteria[0].expectedResetDate").doesNotExist());
    }

    @Test
    void riskProfile_unauthorized_returns403() throws Exception {
        mvc.perform(get("/api/v1/restaurants/{id}/risk-profile", restaurantId)
                        .with(as(userId)))
                .andExpect(status().isForbidden());
    }

    @Test
    void riskProfile_nonExistentRestaurant_returns404() throws Exception {
        mvc.perform(get("/api/v1/restaurants/{id}/risk-profile", 999999L)
                        .with(as(userId, PERMS)))
                .andExpect(status().isNotFound());
    }
}

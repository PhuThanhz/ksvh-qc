package vn.ksvh.qc.risk;

import org.junit.jupiter.api.Test;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.support.ApiTestSupport;

import java.time.LocalDate;
import java.time.ZoneId;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Mô phỏng dùng cấu hình hiệu lực theo ngày (bản tương lai không ảnh hưởng hôm nay). */
class RiskPreviewApiTests extends ApiTestSupport {

    private static final LocalDate TODAY = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));

    @Test
    void usesEscalationRuleEffectiveAtDate() throws Exception {
        jdbc.update("""
                INSERT INTO impact_escalation_rules(threshold_count, step_increase, max_impact, reset_period_months, effective_from)
                VALUES (3, 1, 5, 6, ?)""", java.sql.Date.valueOf(TODAY.minusYears(5)));
        jdbc.update("""
                INSERT INTO impact_escalation_rules(threshold_count, step_increase, max_impact, reset_period_months, effective_from)
                VALUES (2, 2, 5, 6, ?)""", java.sql.Date.valueOf(TODAY.plusDays(40)));

        // Bản đang hiệu lực nhất định có ngưỡng của một phiên bản đã có hiệu lực; 3 lần mức 2 với ngưỡng ≤ 3 → nâng
        mvc.perform(get("/api/v1/risk/preview").param("baseImpact", "2").param("violations", "3")
                        .param("date", TODAY.plusDays(41).toString()).with(as(1L, PermissionCodes.CRITERIA_READ)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.thresholdCount").value(2))
                .andExpect(jsonPath("$.effectiveImpact").value(4))
                .andExpect(jsonPath("$.escalated").value(true))
                .andExpect(jsonPath("$.score").value(12));

        mvc.perform(get("/api/v1/risk/preview").param("baseImpact", "2").param("violations", "1")
                        .with(as(1L, PermissionCodes.CRITERIA_READ)))
                .andExpect(jsonPath("$.frequency").value(1))
                .andExpect(jsonPath("$.effectiveImpact").value(2))
                .andExpect(jsonPath("$.escalated").value(false));

        mvc.perform(get("/api/v1/risk/preview").param("baseImpact", "9").param("violations", "1")
                        .with(as(1L, PermissionCodes.CRITERIA_READ)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void strictPolicyUsesItsOwnEscalationRule() throws Exception {
        jdbc.update("""
                INSERT INTO impact_escalation_rules(risk_policy, threshold_count, step_increase, max_impact, reset_period_months, effective_from)
                VALUES ('STRICT', 2, 1, 5, 12, ?)""", java.sql.Date.valueOf(TODAY));

        // Khắt khe: lần thứ 2 đã nâng mức, kỳ hạ mức riêng 12 tháng
        mvc.perform(get("/api/v1/risk/preview").param("baseImpact", "2").param("violations", "2")
                        .param("policy", "STRICT").with(as(1L, PermissionCodes.CRITERIA_READ)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.policy").value("STRICT"))
                .andExpect(jsonPath("$.thresholdCount").value(2))
                .andExpect(jsonPath("$.resetPeriodMonths").value(12))
                .andExpect(jsonPath("$.escalated").value(true));

        // Không truyền chính sách → Tiêu chuẩn
        mvc.perform(get("/api/v1/risk/preview").param("baseImpact", "2").param("violations", "1")
                        .with(as(1L, PermissionCodes.CRITERIA_READ)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.policy").value("STANDARD"));
    }
}

package vn.ksvh.qc.criteria.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import vn.ksvh.qc.criteria.domain.EscalationRule;
import vn.ksvh.qc.organization.api.RiskPolicy;

import java.time.Instant;
import java.time.LocalDate;

public record EscalationRuleResponse(Long id, RiskPolicy riskPolicy, int thresholdCount, int stepIncrease, int maxImpact, int resetPeriodMonths,
                                     LocalDate effectiveFrom, @Schema(nullable = true) String note, ConfigStatus status,
                                     Instant createdAt, @Schema(nullable = true) String createdByName) {

    public static EscalationRuleResponse from(EscalationRule r, ConfigStatus status, String createdByName) {
        return new EscalationRuleResponse(r.getId(), r.getRiskPolicy(), r.getThresholdCount(), r.getStepIncrease(), r.getMaxImpact(),
                r.getResetPeriodMonths(), r.getEffectiveFrom(), r.getNote(), status, r.getCreatedAt(), createdByName);
    }
}

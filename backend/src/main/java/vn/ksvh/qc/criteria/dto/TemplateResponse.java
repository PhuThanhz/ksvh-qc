package vn.ksvh.qc.criteria.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import vn.ksvh.qc.criteria.domain.InspectionTemplate;

import java.time.Instant;
import java.util.List;

public record TemplateResponse(
        Long id,
        String code,
        String name,
        @Schema(nullable = true) String inspectionType,
        @Schema(nullable = true) String description,
        @Schema(nullable = true) Long companyId,
        @Schema(nullable = true) String companyName,
        boolean active,
        int criterionCount,
        Instant updatedAt,
        @Schema(nullable = true) Integer frequencyPeriodMonths,
        @Schema(nullable = true) Integer escalationThresholdCount,
        @Schema(nullable = true) Integer resetPeriodMonths,
        List<CriterionResponse> criteria) {

    public static TemplateResponse from(InspectionTemplate t, List<CriterionResponse> criteria, String companyName) {
        return new TemplateResponse(
                t.getId(),
                t.getCode(),
                t.getName(),
                t.getInspectionType(),
                t.getDescription(),
                t.getCompanyId(),
                companyName,
                t.isActive(),
                t.getItems().size(),
                t.getUpdatedAt(),
                t.getFrequencyPeriodMonths(),
                t.getEscalationThresholdCount(),
                t.getResetPeriodMonths(),
                criteria);
    }
}

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
        List<CriterionResponse> criteria) {

    public static TemplateResponse from(InspectionTemplate t, List<CriterionResponse> criteria, String companyName) {
        return from(t, criteria, companyName, t.getItems().size());
    }

    public static TemplateResponse from(InspectionTemplate t, List<CriterionResponse> criteria, String companyName, int criterionCount) {
        return new TemplateResponse(
                t.getId(),
                t.getCode(),
                t.getName(),
                t.getInspectionType(),
                t.getDescription(),
                t.getCompanyId(),
                companyName,
                t.isActive(),
                criterionCount,
                t.getUpdatedAt(),
                criteria);
    }
}

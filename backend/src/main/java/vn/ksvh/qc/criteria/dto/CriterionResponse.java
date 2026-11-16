package vn.ksvh.qc.criteria.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import vn.ksvh.qc.criteria.domain.Criterion;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

public record CriterionResponse(
        Long id,
        Long groupId,
        String groupName,
        /** Công ty của nhóm; null = nhóm dùng chung. */
        @Schema(nullable = true) Long groupCompanyId,
        String code,
        String name,
        @Schema(nullable = true) String checkMethod,
        @Schema(nullable = true) String evidenceRequired,
        int baseImpact,
        int sortOrder,
        boolean active,
        Instant updatedAt,
        List<CriterionTemplateRef> templates) {

    public record CriterionTemplateRef(Long id, String code, String name) {}

    public static CriterionResponse from(Criterion c) {
        return from(c, Collections.emptyList());
    }

    public static CriterionResponse from(Criterion c, List<CriterionTemplateRef> templates) {
        return new CriterionResponse(
                c.getId(),
                c.getGroup().getId(),
                c.getGroup().getName(),
                c.getGroup().getCompanyId(),
                c.getCode(),
                c.getName(),
                c.getCheckMethod(),
                c.getEvidenceRequired(),
                c.getBaseImpact(),
                c.getSortOrder(),
                c.isActive(),
                c.getUpdatedAt(),
                templates != null ? templates : Collections.emptyList());
    }
}

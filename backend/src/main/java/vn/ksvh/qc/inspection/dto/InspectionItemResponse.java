package vn.ksvh.qc.inspection.dto;

import vn.ksvh.qc.inspection.domain.InspectionItem;
import vn.ksvh.qc.inspection.domain.ItemResult;

import java.time.Instant;

public record InspectionItemResponse(
        Long id,
        Long criterionId,
        String criterionCode,
        String criterionName,
        String groupName,
        short baseImpact,
        ItemResult result,
        String comment,
        String evidenceUrls,
        int sortOrder,
        Instant evaluatedAt
) {
    public static InspectionItemResponse from(InspectionItem item) {
        return new InspectionItemResponse(
                item.getId(),
                item.getCriterionId(),
                item.getCriterionCode(),
                item.getCriterionName(),
                item.getGroupName(),
                item.getBaseImpact(),
                item.getResult(),
                item.getComment(),
                item.getEvidenceUrls(),
                item.getSortOrder(),
                item.getEvaluatedAt()
        );
    }
}

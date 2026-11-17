package vn.ksvh.qc.inspection.dto;

import vn.ksvh.qc.inspection.domain.Finding;
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
        Instant evaluatedAt,
        Long findingId,
        String findingDescription,
        String findingEvidenceUrls,
        String remediationPlan,
        String remediationEvidenceUrls,
        String findingStatus
) {
    public static InspectionItemResponse from(InspectionItem item) {
        return from(item, null);
    }

    public static InspectionItemResponse from(InspectionItem item, Finding finding) {
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
                item.getEvaluatedAt(),
                item.getFindingId() != null ? item.getFindingId() : (finding != null ? finding.getId() : null),
                finding != null ? finding.getDescription() : null,
                finding != null ? finding.getEvidenceUrls() : null,
                finding != null ? finding.getRemediationPlan() : null,
                finding != null ? finding.getRemediationEvidenceUrls() : null,
                finding != null && finding.getStatus() != null ? finding.getStatus().name() : null
        );
    }
}

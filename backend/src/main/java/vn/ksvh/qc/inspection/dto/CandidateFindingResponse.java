package vn.ksvh.qc.inspection.dto;

import vn.ksvh.qc.inspection.domain.FindingStatus;

import java.time.Instant;
import java.time.LocalDate;

/** Lỗi vi phạm đang chờ nghiệm thu kết quả khắc phục. */
public record CandidateFindingResponse(
        Long id,
        Long inspectionId,
        String inspectionCode,
        Long criterionId,
        String criterionCode,
        String criterionName,
        String groupName,
        short baseImpact,
        short effectiveImpact,
        String riskLevelCode,
        int calculatedScore,
        FindingStatus status,
        String description,
        String evidenceUrls,
        String remediationPlan,
        String remediationEvidenceUrls,
        Instant remediationSubmittedAt,
        LocalDate deadlineDate
) {
}

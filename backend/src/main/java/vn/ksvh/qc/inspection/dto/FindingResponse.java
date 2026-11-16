package vn.ksvh.qc.inspection.dto;

import vn.ksvh.qc.inspection.domain.AppealConclusion;
import vn.ksvh.qc.inspection.domain.Finding;
import vn.ksvh.qc.inspection.domain.FindingStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record FindingResponse(
        Long id,
        Long inspectionId,
        String inspectionCode,
        Long inspectionItemId,
        Long restaurantId,
        String restaurantName,
        Long criterionId,
        String criterionCode,
        String criterionName,
        short baseImpact,
        short effectiveImpact,
        int violationCount,
        int calculatedScore,
        String riskLevelCode,
        String riskLevelName,
        int remediationDays,
        LocalDate deadlineDate,
        FindingStatus status,
        String description,
        String evidenceUrls,
        String remediationPlan,
        LocalDate remediationTargetDate,
        String remediationEvidenceUrls,
        Instant remediationSubmittedAt,
        String verificationComment,
        Long verifiedBy,
        String verifiedByName,
        Instant verifiedAt,
        String appealReason,
        String appealEvidenceUrls,
        Instant appealSubmittedAt,
        Long appealConcludedBy,
        String appealConcludedByName,
        AppealConclusion appealConclusion,
        Instant createdAt,
        List<FindingEventResponse> history
) {
    public static FindingResponse from(Finding f, String inspectionCode, String restaurantName,
                                       String criterionCode, String criterionName,
                                       String verifiedByName, String appealConcludedByName) {
        return from(f, inspectionCode, restaurantName, criterionCode, criterionName, verifiedByName, appealConcludedByName, List.of());
    }

    public static FindingResponse from(Finding f, String inspectionCode, String restaurantName,
                                       String criterionCode, String criterionName,
                                       String verifiedByName, String appealConcludedByName,
                                       List<FindingEventResponse> history) {
        return new FindingResponse(
                f.getId(),
                f.getInspectionId(),
                inspectionCode,
                f.getInspectionItemId(),
                f.getRestaurantId(),
                restaurantName,
                f.getCriterionId(),
                criterionCode,
                criterionName,
                f.getBaseImpact(),
                f.getEffectiveImpact(),
                f.getViolationCount(),
                f.getCalculatedScore(),
                f.getRiskLevelCode(),
                f.getRiskLevelName(),
                f.getRemediationDays(),
                f.getDeadlineDate(),
                f.getStatus(),
                f.getDescription(),
                f.getEvidenceUrls(),
                f.getRemediationPlan(),
                f.getRemediationTargetDate(),
                f.getRemediationEvidenceUrls(),
                f.getRemediationSubmittedAt(),
                f.getVerificationComment(),
                f.getVerifiedBy(),
                verifiedByName,
                f.getVerifiedAt(),
                f.getAppealReason(),
                f.getAppealEvidenceUrls(),
                f.getAppealSubmittedAt(),
                f.getAppealConcludedBy(),
                appealConcludedByName,
                f.getAppealConclusion(),
                f.getCreatedAt(),
                history
        );
    }
}

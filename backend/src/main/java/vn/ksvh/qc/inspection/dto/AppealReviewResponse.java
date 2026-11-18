package vn.ksvh.qc.inspection.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import vn.ksvh.qc.inspection.domain.AppealReview;
import vn.ksvh.qc.inspection.domain.AppealVerdict;

import java.time.Instant;

public record AppealReviewResponse(
        Long id,
        Long findingId,
        Long reviewerId,
        String reviewerName,
        boolean ksvhRep,
        AppealVerdict verdict,
        @Schema(nullable = true) String comment,
        @Schema(nullable = true) Instant reviewedAt,
        int appealRound,
        Instant createdAt
) {
    public static AppealReviewResponse from(AppealReview r, String reviewerName) {
        return new AppealReviewResponse(
                r.getId(),
                r.getFindingId(),
                r.getReviewerId(),
                reviewerName,
                r.isKsvhRep(),
                r.getVerdict(),
                r.getComment(),
                r.getReviewedAt(),
                r.getAppealRound(),
                r.getCreatedAt()
        );
    }
}

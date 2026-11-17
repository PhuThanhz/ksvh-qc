package vn.ksvh.qc.inspection.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.inspection")
public record InspectionProperties(
        int maxInspectionsPerMonth,
        int minAppealReviewers,
        int maxAppealReviewers,
        int maxEvidenceFiles,
        double defaultCheckinRadiusMeters
) {
    public InspectionProperties {
        if (maxInspectionsPerMonth <= 0) maxInspectionsPerMonth = 99;
        if (minAppealReviewers <= 0) minAppealReviewers = 2;
        if (maxAppealReviewers <= 0) maxAppealReviewers = 5;
        if (maxEvidenceFiles <= 0) maxEvidenceFiles = 20;
        if (defaultCheckinRadiusMeters <= 0) defaultCheckinRadiusMeters = 150.0;
    }
}

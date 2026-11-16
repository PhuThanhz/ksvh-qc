package vn.ksvh.qc.inspection.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.ksvh.qc.shared.persistence.BaseEntity;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "findings")
@Getter
@Setter
@NoArgsConstructor
public class Finding extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private long version;

    @Column(name = "inspection_id", nullable = false)
    private Long inspectionId;

    @Column(name = "inspection_item_id", nullable = false)
    private Long inspectionItemId;

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    @Column(name = "criterion_id", nullable = false)
    private Long criterionId;

    @Column(name = "base_impact", nullable = false)
    private short baseImpact;

    @Column(name = "effective_impact", nullable = false)
    private short effectiveImpact;

    @Column(name = "violation_count", nullable = false)
    private int violationCount = 1;

    @Column(name = "calculated_score", nullable = false)
    private int calculatedScore = 1;

    @Column(name = "risk_level_code", nullable = false, length = 20)
    private String riskLevelCode;

    @Column(name = "risk_level_name", length = 100)
    private String riskLevelName;

    @Column(name = "remediation_days", nullable = false)
    private int remediationDays = 7;

    @Column(name = "deadline_date")
    private LocalDate deadlineDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FindingStatus status = FindingStatus.OPEN;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Column(name = "evidence_urls", columnDefinition = "text")
    private String evidenceUrls;

    @Column(name = "remediation_plan", columnDefinition = "text")
    private String remediationPlan;

    @Column(name = "remediation_target_date")
    private LocalDate remediationTargetDate;

    @Column(name = "remediation_evidence_urls", columnDefinition = "text")
    private String remediationEvidenceUrls;

    @Column(name = "remediation_submitted_at")
    private Instant remediationSubmittedAt;

    @Column(name = "verification_comment", columnDefinition = "text")
    private String verificationComment;

    @Column(name = "verified_by")
    private Long verifiedBy;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "appeal_reason", columnDefinition = "text")
    private String appealReason;

    @Column(name = "appeal_evidence_urls", columnDefinition = "text")
    private String appealEvidenceUrls;

    @Column(name = "appeal_submitted_at")
    private Instant appealSubmittedAt;

    @Column(name = "appeal_concluded_by")
    private Long appealConcludedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "appeal_conclusion", length = 30)
    private AppealConclusion appealConclusion;
}

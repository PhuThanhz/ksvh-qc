package vn.ksvh.qc.inspection.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.ksvh.qc.shared.persistence.BaseEntity;

import java.time.Instant;

/** Phiếu thẩm định khiếu nại của từng thành viên hội đồng (PDF s.12). */
@Entity
@Table(name = "appeal_reviews")
@Getter
@Setter
@NoArgsConstructor
public class AppealReview extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "finding_id", nullable = false)
    private Long findingId;

    @Column(name = "reviewer_id", nullable = false)
    private Long reviewerId;

    @Column(name = "is_ksvh_rep", nullable = false)
    private boolean ksvhRep;

    @Enumerated(EnumType.STRING)
    @Column(name = "verdict", nullable = false)
    private AppealVerdict verdict = AppealVerdict.PENDING;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "appeal_round", nullable = false)
    private int appealRound = 1;
}

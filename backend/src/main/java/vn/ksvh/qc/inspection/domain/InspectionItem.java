package vn.ksvh.qc.inspection.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "inspection_items")
@Getter
@Setter
@NoArgsConstructor
public class InspectionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inspection_id", nullable = false)
    private Inspection inspection;

    @Column(name = "criterion_id", nullable = false)
    private Long criterionId;

    @Column(name = "criterion_code", nullable = false, length = 30)
    private String criterionCode;

    @Column(name = "criterion_name", nullable = false, length = 300)
    private String criterionName;

    @Column(name = "group_name", length = 200)
    private String groupName;

    @Column(name = "base_impact", nullable = false)
    private short baseImpact;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ItemResult result = ItemResult.UNRATED;

    @Column(columnDefinition = "text")
    private String comment;

    @Column(name = "evidence_urls", columnDefinition = "text")
    private String evidenceUrls;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "evaluated_at")
    private Instant evaluatedAt;
}

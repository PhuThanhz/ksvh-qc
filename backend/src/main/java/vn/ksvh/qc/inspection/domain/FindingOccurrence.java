package vn.ksvh.qc.inspection.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "finding_occurrences")
@Getter
@Setter
@NoArgsConstructor
public class FindingOccurrence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    @Column(name = "criterion_id", nullable = false)
    private Long criterionId;

    @Column(name = "finding_id")
    private Long findingId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OccurrenceSource source;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    public FindingOccurrence(Long restaurantId, Long criterionId, Long findingId, OccurrenceSource source, Instant occurredAt) {
        this.restaurantId = restaurantId;
        this.criterionId = criterionId;
        this.findingId = findingId;
        this.source = source;
        this.occurredAt = occurredAt;
    }
}

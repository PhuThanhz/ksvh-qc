package vn.ksvh.qc.inspection.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import vn.ksvh.qc.shared.persistence.BaseEntity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "inspections")
@Getter
@Setter
@NoArgsConstructor
public class Inspection extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private long version;

    @Column(nullable = false, length = 30)
    private String code;

    @Column(name = "plan_id")
    private Long planId;

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    @Column(name = "template_id", nullable = false)
    private Long templateId;

    @Column(name = "inspector_id", nullable = false)
    private Long inspectorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "inspection_type", nullable = false, length = 20)
    private InspectionKind inspectionType = InspectionKind.PERIODIC;

    @Enumerated(EnumType.STRING)
    @Column(name = "inspection_mode", nullable = false, length = 20)
    private InspectionMode inspectionMode = InspectionMode.ON_SITE;

    @Enumerated(EnumType.STRING)
    @Column(name = "location_status", length = 20)
    private LocationStatus locationStatus;

    /** Chuyên đề (nhóm tiêu chí) của phiếu đột xuất. */
    @ElementCollection
    @BatchSize(size = 50)
    @CollectionTable(name = "inspection_topics", joinColumns = @JoinColumn(name = "inspection_id"))
    @Column(name = "criterion_group_id")
    private Set<Long> topicGroupIds = new LinkedHashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private InspectionStatus status = InspectionStatus.ASSIGNED;

    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;

    @Column(name = "checkin_lat")
    private Double checkinLat;

    @Column(name = "checkin_lng")
    private Double checkinLng;

    @Column(name = "checkin_distance_m")
    private Double checkinDistanceM;

    @Column(name = "checkin_at")
    private Instant checkinAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    /** CHT xác nhận đã xem (phiếu không có lỗi). */
    @Column(name = "acknowledged_by")
    private Long acknowledgedBy;

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(length = 1000)
    private String notes;

    @Column(name = "created_by")
    private Long createdBy;

    @OneToMany(mappedBy = "inspection", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    @OrderBy("sortOrder ASC")
    private List<InspectionItem> items = new ArrayList<>();
}

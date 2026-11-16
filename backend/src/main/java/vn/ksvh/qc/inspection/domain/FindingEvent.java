package vn.ksvh.qc.inspection.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** Một dòng lịch sử thao tác trên lỗi. Chỉ thêm mới, không sửa/xoá. */
@Entity
@Table(name = "finding_events")
@Getter
@NoArgsConstructor
public class FindingEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "finding_id", nullable = false, updatable = false)
    private Long findingId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40, updatable = false)
    private FindingEventAction action;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30, updatable = false)
    private FindingStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 30, updatable = false)
    private FindingStatus toStatus;

    @Column(name = "actor_id", updatable = false)
    private Long actorId;

    @Column(columnDefinition = "text", updatable = false)
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public FindingEvent(Long findingId, FindingEventAction action, FindingStatus fromStatus, FindingStatus toStatus,
                        Long actorId, String note, Instant createdAt) {
        this.findingId = findingId;
        this.action = action;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.actorId = actorId;
        this.note = note;
        this.createdAt = createdAt;
    }
}

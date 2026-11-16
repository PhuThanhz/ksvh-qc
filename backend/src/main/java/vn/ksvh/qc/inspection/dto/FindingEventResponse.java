package vn.ksvh.qc.inspection.dto;

import vn.ksvh.qc.inspection.domain.FindingEvent;
import vn.ksvh.qc.inspection.domain.FindingEventAction;
import vn.ksvh.qc.inspection.domain.FindingStatus;

import java.time.Instant;

/** Một dòng lịch sử thao tác trên lỗi. */
public record FindingEventResponse(
        Long id,
        FindingEventAction action,
        FindingStatus fromStatus,
        FindingStatus toStatus,
        Long actorId,
        String actorName,
        String note,
        Instant createdAt
) {
    public static FindingEventResponse from(FindingEvent e, String actorName) {
        return new FindingEventResponse(e.getId(), e.getAction(), e.getFromStatus(), e.getToStatus(),
                e.getActorId(), actorName, e.getNote(), e.getCreatedAt());
    }
}

package vn.ksvh.qc.inspection.api.event;

public record AppealMeetingRequiredEvent(
        Long findingId,
        Long inspectionId,
        Long restaurantId,
        String restaurantName,
        String criterionName
) {
}

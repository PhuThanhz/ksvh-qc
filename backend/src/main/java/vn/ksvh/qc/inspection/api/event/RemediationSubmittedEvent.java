package vn.ksvh.qc.inspection.api.event;

public record RemediationSubmittedEvent(
        Long findingId,
        Long inspectionId,
        Long restaurantId,
        String restaurantName,
        String criterionName,
        Long inspectorId
) {
}

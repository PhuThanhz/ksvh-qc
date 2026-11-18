package vn.ksvh.qc.inspection.api.event;

public record InspectionSubmittedEvent(
        Long inspectionId,
        String inspectionCode,
        Long restaurantId,
        String restaurantName,
        Long inspectorId,
        int findingsCount
) {
}

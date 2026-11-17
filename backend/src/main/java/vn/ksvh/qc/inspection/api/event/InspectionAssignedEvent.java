package vn.ksvh.qc.inspection.api.event;

public record InspectionAssignedEvent(
        Long inspectionId,
        String inspectionCode,
        Long restaurantId,
        String restaurantName,
        Long inspectorId,
        String inspectionType
) {
}

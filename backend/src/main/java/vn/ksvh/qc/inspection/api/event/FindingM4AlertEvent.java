package vn.ksvh.qc.inspection.api.event;

public record FindingM4AlertEvent(
        Long findingId,
        Long inspectionId,
        Long restaurantId,
        String restaurantName,
        String criterionName,
        int calculatedScore
) {
}

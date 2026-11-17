package vn.ksvh.qc.inspection.api.event;

public record FindingAppealConcludedEvent(
        Long findingId,
        Long inspectionId,
        Long restaurantId,
        String restaurantName,
        String criterionName,
        String conclusion,
        Long concludedById,
        String concludedByName
) {
}

package vn.ksvh.qc.inspection.api.event;

public record FindingVerifiedEvent(
        Long findingId,
        Long inspectionId,
        Long restaurantId,
        String restaurantName,
        String criterionName,
        boolean passed,
        Long verifiedById,
        String verifiedByName
) {
}

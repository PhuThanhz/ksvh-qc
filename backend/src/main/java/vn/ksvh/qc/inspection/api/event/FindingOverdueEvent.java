package vn.ksvh.qc.inspection.api.event;

public record FindingOverdueEvent(
        Long findingId,
        Long restaurantId,
        String restaurantName,
        String criterionName,
        int newScore
) {
}

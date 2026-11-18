package vn.ksvh.qc.inspection.api.event;

import java.util.List;

public record FindingAppealedEvent(
        Long findingId,
        Long inspectionId,
        Long restaurantId,
        String restaurantName,
        String criterionName,
        List<Long> reviewerIds
) {
}

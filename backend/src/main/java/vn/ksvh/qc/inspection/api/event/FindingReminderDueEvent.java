package vn.ksvh.qc.inspection.api.event;

import java.time.LocalDate;

public record FindingReminderDueEvent(
        Long findingId,
        Long restaurantId,
        String restaurantName,
        String criterionName,
        LocalDate deadlineDate
) {
}

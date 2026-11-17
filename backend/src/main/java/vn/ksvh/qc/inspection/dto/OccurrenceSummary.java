package vn.ksvh.qc.inspection.dto;

import java.time.LocalDate;

public record OccurrenceSummary(
        LocalDate occurredAt,
        String source,
        Long findingId
) {
}

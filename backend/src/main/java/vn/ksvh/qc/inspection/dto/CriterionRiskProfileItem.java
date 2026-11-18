package vn.ksvh.qc.inspection.dto;

import java.time.LocalDate;
import java.util.List;

public record CriterionRiskProfileItem(
        Long criterionId,
        String criterionCode,
        String criterionName,
        String groupName,
        int baseImpact,
        int effectiveImpact,
        boolean isEscalated,
        int frequencyInPeriod,
        int totalHistoricalViolations,
        LocalDate lastViolationDate,
        LocalDate expectedResetDate,
        long cleanMonthsCount,
        long openFindingsCount,
        List<OccurrenceSummary> occurrences
) {
}

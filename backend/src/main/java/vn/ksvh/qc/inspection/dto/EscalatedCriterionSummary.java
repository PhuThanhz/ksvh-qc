package vn.ksvh.qc.inspection.dto;

import java.time.LocalDate;

public record EscalatedCriterionSummary(
        Long restaurantId,
        String restaurantCode,
        String restaurantName,
        String companyName,
        Long criterionId,
        String criterionCode,
        String criterionName,
        String groupName,
        int baseImpact,
        int effectiveImpact,
        int frequencyInPeriod,
        LocalDate lastViolationDate,
        LocalDate expectedResetDate,
        long cleanMonthsCount
) {
}

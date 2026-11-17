package vn.ksvh.qc.audit.dto;

import java.time.LocalDate;

public record AuditLogFilter(
        String keyword,
        String action,
        String targetType,
        Long userId,
        LocalDate fromDate,
        LocalDate toDate
) {
}

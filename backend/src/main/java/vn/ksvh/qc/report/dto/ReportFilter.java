package vn.ksvh.qc.report.dto;

import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/** Bộ lọc tham số cho các báo cáo KSVH. */
public record ReportFilter(
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        Long companyId,
        Long restaurantId,
        Long inspectorId,
        Long groupId
) {
    public LocalDate safeFrom(LocalDate defaultFrom) {
        return from != null ? from : defaultFrom;
    }

    public LocalDate safeTo(LocalDate defaultTo) {
        return to != null ? to : defaultTo;
    }
}

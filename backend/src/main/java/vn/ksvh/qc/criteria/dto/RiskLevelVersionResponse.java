package vn.ksvh.qc.criteria.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Một phiên bản bảng phân loại rủi ro. */
public record RiskLevelVersionResponse(
        LocalDate effectiveFrom,
        ConfigStatus status,
        Instant updatedAt,
        String updatedByName,
        List<RiskLevelItem> levels) {
}

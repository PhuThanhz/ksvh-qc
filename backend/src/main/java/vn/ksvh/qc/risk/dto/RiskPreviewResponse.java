package vn.ksvh.qc.risk.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

/** Kết quả mô phỏng một lần lỗi theo cấu hình hiệu lực tại {@code date}. */
public record RiskPreviewResponse(
        LocalDate date,
        int periodMonths,
        LocalDate periodStart,
        @Schema(nullable = true) Integer thresholdCount,
        @Schema(nullable = true) Integer stepIncrease,
        @Schema(nullable = true) Integer maxImpact,
        @Schema(nullable = true) Integer resetPeriodMonths,
        int baseImpact,
        int frequency,
        int effectiveImpact,
        boolean escalated,
        int score,
        @Schema(nullable = true) String levelCode,
        @Schema(nullable = true) String levelName,
        @Schema(nullable = true) Integer remediationDays) {
}

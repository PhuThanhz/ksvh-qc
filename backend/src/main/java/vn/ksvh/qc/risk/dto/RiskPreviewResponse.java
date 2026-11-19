package vn.ksvh.qc.risk.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import vn.ksvh.qc.organization.api.RiskPolicy;

import java.time.LocalDate;

/** Kết quả mô phỏng một lần lỗi theo cấu hình hiệu lực tại {@code date}. */
public record RiskPreviewResponse(
        LocalDate date,
        /** Chính sách mà quy tắc nâng mức được lấy ra (Khắt khe chưa khai báo thì về Tiêu chuẩn). */
        RiskPolicy policy,
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

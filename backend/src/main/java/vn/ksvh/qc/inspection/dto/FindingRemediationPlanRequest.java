package vn.ksvh.qc.inspection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record FindingRemediationPlanRequest(
        @NotBlank(message = "Bắt buộc nhập kế hoạch và giải pháp khắc phục")
        String remediationPlan,

        @NotNull(message = "Bắt buộc chọn ngày hẹn hoàn thành khắc phục")
        LocalDate remediationDeadline
) {
}

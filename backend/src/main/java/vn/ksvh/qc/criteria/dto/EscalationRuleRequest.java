package vn.ksvh.qc.criteria.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record EscalationRuleRequest(
        @NotNull(message = "Vui lòng nhập ngưỡng")
        @Min(value = 2, message = "Ngưỡng tối thiểu 2 lần")
        @Max(value = 50, message = "Ngưỡng tối đa 50 lần")
        Integer thresholdCount,

        @NotNull(message = "Vui lòng nhập số bậc tăng")
        @Min(value = 1, message = "Số bậc tăng từ 1 đến 4")
        @Max(value = 4, message = "Số bậc tăng từ 1 đến 4")
        Integer stepIncrease,

        @NotNull(message = "Vui lòng nhập mức trần")
        @Min(value = 1, message = "Mức trần từ 1 đến 5")
        @Max(value = 5, message = "Mức trần từ 1 đến 5")
        Integer maxImpact,

        @NotNull(message = "Vui lòng nhập kỳ hạ lại")
        @Min(value = 1, message = "Kỳ hạ lại từ 1 đến 24 tháng")
        @Max(value = 24, message = "Kỳ hạ lại từ 1 đến 24 tháng")
        Integer resetPeriodMonths,

        @NotNull(message = "Vui lòng chọn ngày hiệu lực")
        LocalDate effectiveFrom,

        @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
        String note) {
}

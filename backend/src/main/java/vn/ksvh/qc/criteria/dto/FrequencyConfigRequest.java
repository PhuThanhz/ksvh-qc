package vn.ksvh.qc.criteria.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record FrequencyConfigRequest(
        @NotNull(message = "Vui lòng nhập kỳ đếm")
        @Min(value = 1, message = "Kỳ đếm từ 1 đến 24 tháng")
        @Max(value = 24, message = "Kỳ đếm từ 1 đến 24 tháng")
        Integer periodMonths,

        @NotNull(message = "Vui lòng chọn ngày hiệu lực")
        LocalDate effectiveFrom,

        @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
        String note) {
}

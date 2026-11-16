package vn.ksvh.qc.criteria.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record FrequencyConfigRequest(
        @NotNull(message = "Vui lòng chọn kỳ đếm")
        Integer periodMonths,

        @NotNull(message = "Vui lòng chọn ngày hiệu lực")
        LocalDate effectiveFrom,

        @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
        String note) {
}

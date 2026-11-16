package vn.ksvh.qc.criteria.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

/** Một phiên bản bảng phân loại rủi ro, áp dụng từ effectiveFrom (từ hôm nay trở đi). */
public record RiskLevelVersionRequest(
        @NotNull(message = "Vui lòng chọn ngày hiệu lực")
        LocalDate effectiveFrom,

        @NotEmpty(message = "Phải có ít nhất một mức rủi ro")
        @Size(max = 20, message = "Tối đa 20 mức rủi ro")
        List<@Valid RiskLevelItem> levels) {
}

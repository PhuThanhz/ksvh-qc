package vn.ksvh.qc.criteria.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import vn.ksvh.qc.criteria.domain.RiskLevel;

import java.math.BigDecimal;

/** Một mức rủi ro. Khoảng điểm [minScore, maxScore); maxScore trống = không giới hạn trên (chỉ mức cao nhất). */
public record RiskLevelItem(
        @NotBlank(message = "Vui lòng nhập mã mức")
        @Pattern(regexp = "^[A-Z0-9]{1,10}$", message = "Mã mức gồm chữ in hoa không dấu và số, tối đa 10 ký tự")
        String code,

        @NotBlank(message = "Vui lòng nhập tên mức")
        @Size(max = 100, message = "Tên mức tối đa 100 ký tự")
        String name,

        @NotNull(message = "Vui lòng nhập điểm từ")
        @DecimalMin(value = "0", message = "Điểm không được âm")
        BigDecimal minScore,

        @Schema(nullable = true)
        BigDecimal maxScore,

        @NotNull(message = "Vui lòng nhập hạn khắc phục")
        @Min(value = 1, message = "Hạn khắc phục tối thiểu 1 ngày")
        @Max(value = 365, message = "Hạn khắc phục tối đa 365 ngày")
        Integer remediationDays,

        @Schema(nullable = true)
        @Size(max = 500, message = "Hành động tối đa 500 ký tự")
        String action) {

    public static RiskLevelItem from(RiskLevel r) {
        return new RiskLevelItem(r.getCode(), r.getName(), r.getMinScore(), r.getMaxScore(), r.getRemediationDays(),
                r.getAction());
    }
}

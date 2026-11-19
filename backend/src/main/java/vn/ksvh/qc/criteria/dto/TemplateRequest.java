package vn.ksvh.qc.criteria.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/** criterionIds: theo đúng thứ tự hiển thị khi chấm. */
public record TemplateRequest(
        @NotBlank(message = "Vui lòng nhập mã mẫu phiếu")
        @Size(max = 30, message = "Mã mẫu phiếu tối đa 30 ký tự")
        @Pattern(regexp = "^[A-Za-z0-9_-]*$", message = "Mã chỉ gồm chữ không dấu, số, dấu gạch ngang hoặc gạch dưới")
        String code,

        @NotBlank(message = "Vui lòng nhập tên mẫu phiếu")
        @Size(max = 200, message = "Tên mẫu phiếu tối đa 200 ký tự")
        String name,

        @Size(max = 100, message = "Loại kiểm tra tối đa 100 ký tự")
        String inspectionType,

        @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
        String description,

        Long companyId,

        @NotEmpty(message = "Mẫu phiếu phải có ít nhất một tiêu chí")
        @Size(max = 500, message = "Mẫu phiếu tối đa 500 tiêu chí")
        List<Long> criterionIds,

        boolean active,

        @Min(value = 1, message = "Kỳ đếm tần suất tối thiểu 1 tháng")
        @Max(value = 24, message = "Kỳ đếm tần suất tối đa 24 tháng")
        Integer frequencyPeriodMonths,

        @Min(value = 1, message = "Ngưỡng nâng mức rủi ro tối thiểu 1 lần")
        @Max(value = 10, message = "Ngưỡng nâng mức rủi ro tối đa 10 lần")
        Integer escalationThresholdCount,

        @Min(value = 1, message = "Kỳ hạ mức rủi ro tối thiểu 1 tháng")
        @Max(value = 24, message = "Kỳ hạ mức rủi ro tối đa 24 tháng")
        Integer resetPeriodMonths) {

    public TemplateRequest(String code, String name, String inspectionType, String description,
                           Long companyId, List<Long> criterionIds, boolean active) {
        this(code, name, inspectionType, description, companyId, criterionIds, active, null, null, null);
    }
}

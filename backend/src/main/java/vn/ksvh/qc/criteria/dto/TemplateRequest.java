package vn.ksvh.qc.criteria.dto;

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

        boolean active) {
}

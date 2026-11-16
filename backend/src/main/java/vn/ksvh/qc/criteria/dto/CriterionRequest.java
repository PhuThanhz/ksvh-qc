package vn.ksvh.qc.criteria.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CriterionRequest(
        @NotNull(message = "Vui lòng chọn nhóm tiêu chí")
        Long groupId,

        @NotBlank(message = "Vui lòng nhập mã tiêu chí")
        @Size(max = 30, message = "Mã tiêu chí tối đa 30 ký tự")
        @Pattern(regexp = "^[A-Za-z0-9_.-]*$", message = "Mã chỉ gồm chữ không dấu, số, dấu chấm, gạch ngang hoặc gạch dưới")
        String code,

        @NotBlank(message = "Vui lòng nhập tên tiêu chí")
        @Size(max = 300, message = "Tên tiêu chí tối đa 300 ký tự")
        String name,

        @Size(max = 4000, message = "Cách kiểm tra tối đa 4000 ký tự")
        String checkMethod,

        @Size(max = 4000, message = "Bằng chứng yêu cầu tối đa 4000 ký tự")
        String evidenceRequired,

        @NotNull(message = "Vui lòng chọn mức ảnh hưởng")
        @Min(value = 1, message = "Mức ảnh hưởng từ 1 đến 5")
        @Max(value = 5, message = "Mức ảnh hưởng từ 1 đến 5")
        Integer baseImpact,

        @Min(value = 0, message = "Thứ tự không được âm")
        @Max(value = 9999, message = "Thứ tự tối đa 9999")
        int sortOrder,

        boolean active,

        List<Long> templateIds) {
}

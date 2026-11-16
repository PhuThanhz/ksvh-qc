package vn.ksvh.qc.criteria.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CriterionGroupRequest(
        @NotBlank(message = "Vui lòng nhập mã nhóm")
        @Size(max = 30, message = "Mã nhóm tối đa 30 ký tự")
        @Pattern(regexp = "^[A-Za-z0-9_-]*$", message = "Mã chỉ gồm chữ không dấu, số, dấu gạch ngang hoặc gạch dưới")
        String code,

        @NotBlank(message = "Vui lòng nhập tên nhóm")
        @Size(max = 200, message = "Tên nhóm tối đa 200 ký tự")
        String name,

        @Min(value = 0, message = "Thứ tự không được âm")
        @Max(value = 9999, message = "Thứ tự tối đa 9999")
        int sortOrder,

        Long companyId,

        boolean active) {
}

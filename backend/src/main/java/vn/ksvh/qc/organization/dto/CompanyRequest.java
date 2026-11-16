package vn.ksvh.qc.organization.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CompanyRequest(
        @NotBlank(message = "Vui lòng nhập mã công ty")
        @Size(max = 30, message = "Mã công ty tối đa 30 ký tự")
        @Pattern(regexp = "^[A-Za-z0-9_-]*$", message = "Mã chỉ gồm chữ không dấu, số, dấu gạch ngang hoặc gạch dưới")
        String code,

        @NotBlank(message = "Vui lòng nhập tên công ty")
        @Size(max = 200, message = "Tên công ty tối đa 200 ký tự")
        String name,

        boolean active) {
}

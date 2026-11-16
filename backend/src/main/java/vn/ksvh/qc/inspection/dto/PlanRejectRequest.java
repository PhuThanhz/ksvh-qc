package vn.ksvh.qc.inspection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PlanRejectRequest(
        @NotBlank(message = "Bắt buộc nhập lý do từ chối kế hoạch")
        @Size(max = 500, message = "Lý do tối đa 500 ký tự")
        String reason
) {
}

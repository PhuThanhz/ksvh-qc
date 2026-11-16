package vn.ksvh.qc.inspection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InspectionCancelRequest(
        @NotBlank(message = "Bắt buộc nhập lý do huỷ phiếu")
        @Size(max = 500, message = "Lý do tối đa 500 ký tự")
        String reason
) {
}

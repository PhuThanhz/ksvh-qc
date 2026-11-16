package vn.ksvh.qc.inspection.dto;

import jakarta.validation.constraints.NotNull;

public record FindingVerifyRequest(
        @NotNull(message = "Bắt buộc chọn kết quả nghiệm thu (passed = true/false)")
        Boolean passed,

        String comment
) {
}

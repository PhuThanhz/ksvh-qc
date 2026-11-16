package vn.ksvh.qc.inspection.dto;

import jakarta.validation.constraints.NotBlank;

public record FindingAppealRequest(
        @NotBlank(message = "Bắt buộc nhập lý do khiếu nại")
        String appealReason,

        String appealEvidenceUrls
) {
}

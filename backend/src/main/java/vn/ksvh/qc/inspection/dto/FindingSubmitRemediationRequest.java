package vn.ksvh.qc.inspection.dto;

import jakarta.validation.constraints.NotBlank;

public record FindingSubmitRemediationRequest(
        @NotBlank(message = "Bắt buộc có ảnh/video bằng chứng khắc phục")
        String remediationEvidenceUrls
) {
}

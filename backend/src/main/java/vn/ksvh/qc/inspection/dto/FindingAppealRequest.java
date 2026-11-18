package vn.ksvh.qc.inspection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record FindingAppealRequest(
        @NotBlank(message = "Bắt buộc nhập lý do khiếu nại")
        String appealReason,

        String appealEvidenceUrls,

        @NotEmpty(message = "Vui lòng chọn danh sách người thẩm định khiếu nại")
        @Size(min = 2, max = 5, message = "Số lượng người thẩm định khiếu nại phải từ 2 đến 5 người")
        List<Long> reviewerIds
) {
}

package vn.ksvh.qc.inspection.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

@Schema(description = "Yêu cầu nghiệm thu hàng loạt lỗi (dành cho Chuyên viên KSVH)")
public record BatchFindingVerifyRequest(
        @NotEmpty(message = "Danh sách nghiệm thu không được rỗng")
        List<BatchVerifyItem> items
) {
    public record BatchVerifyItem(
            @NotNull(message = "Mã lỗi không được rỗng")
            Long findingId,
            @NotNull(message = "Kết quả nghiệm thu không được rỗng")
            Boolean passed,
            @Schema(nullable = true)
            String comment
    ) {
    }
}

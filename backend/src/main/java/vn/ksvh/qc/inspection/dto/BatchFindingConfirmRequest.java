package vn.ksvh.qc.inspection.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

@Schema(description = "Yêu cầu xác nhận nhận lỗi hàng loạt (dành cho CHT)")
public record BatchFindingConfirmRequest(
        @NotEmpty(message = "Danh sách mã lỗi không được rỗng")
        List<Long> findingIds,
        @Schema(nullable = true)
        String note
) {
}

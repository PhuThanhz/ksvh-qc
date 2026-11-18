package vn.ksvh.qc.inspection.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Kết quả thực hiện thao tác hàng loạt")
public record BatchActionResultResponse(
        int successCount,
        String message
) {
}

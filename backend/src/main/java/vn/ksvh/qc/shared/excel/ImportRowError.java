package vn.ksvh.qc.shared.excel;

import io.swagger.v3.oas.annotations.media.Schema;

/** Lỗi ở một dòng của file nhập. row là số dòng như Excel hiển thị (bắt đầu từ 1). */
public record ImportRowError(
        String sheet,
        int row,
        @Schema(nullable = true) String column,
        String message) {
}

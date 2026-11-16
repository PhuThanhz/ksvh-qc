package vn.ksvh.qc.shared.excel;

import java.util.List;

/**
 * Kết quả nhập Excel. committed = false: chỉ kiểm tra (hoặc có lỗi), chưa ghi gì vào hệ thống.
 * created / updated: số dòng sẽ (hoặc đã) thêm mới / cập nhật.
 */
public record ImportResult(
        boolean committed,
        int totalRows,
        int created,
        int updated,
        List<ImportRowError> errors) {
}

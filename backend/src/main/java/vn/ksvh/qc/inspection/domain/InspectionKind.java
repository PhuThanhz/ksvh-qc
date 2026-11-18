package vn.ksvh.qc.inspection.domain;

/**
 * Loại kiểm tra:
 * - PERIODIC: định kỳ tháng – đủ mẫu phiếu, thực tế.
 * - SURPRISE: đột xuất – theo chuyên đề.
 * - VERIFICATION: kiểm tra kết quả khắc phục – gom các lỗi chờ nghiệm thu vào một phiếu, thực tế hoặc từ xa.
 */
public enum InspectionKind {
    PERIODIC,
    SURPRISE,
    VERIFICATION
}

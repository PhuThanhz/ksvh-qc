package vn.ksvh.qc.criteria.dto;

/** Trạng thái một phiên bản cấu hình so với hôm nay. */
public enum ConfigStatus {
    /** Đang áp dụng. */
    CURRENT,
    /** Hiệu lực từ ngày trong tương lai; còn xoá được. */
    SCHEDULED,
    /** Đã bị phiên bản mới hơn thay thế. */
    PAST
}

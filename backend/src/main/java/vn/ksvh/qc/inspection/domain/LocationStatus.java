package vn.ksvh.qc.inspection.domain;

/** Kết quả xác nhận vị trí khi bắt đầu kiểm tra (chỉ ghi nhận, không chặn). */
public enum LocationStatus {
    VERIFIED,
    OUTSIDE_RADIUS,
    UNVERIFIED,
    REMOTE
}

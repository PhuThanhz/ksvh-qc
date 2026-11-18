package vn.ksvh.qc.inspection.domain;

public enum InspectionStatus {
    ASSIGNED,
    IN_PROGRESS,
    SUBMITTED,
    /** Đã gửi, không có lỗi: chờ CHT xác nhận đã xem rồi mới hoàn thành. */
    AWAITING_ACK,
    COMPLETED,
    CANCELLED
}

package vn.ksvh.qc.inspection.domain;

/** Loại thao tác trên lỗi, ghi vào lịch sử {@link FindingEvent}. */
public enum FindingEventAction {
    CREATED,
    CONFIRMED,
    APPEALED,
    APPEAL_REVIEWED,
    APPEAL_MEETING,
    APPEAL_UPHELD,
    APPEAL_DISMISSED,
    REMEDIATION_PLANNED,
    REMEDIATION_SUBMITTED,
    VERIFY_PASSED,
    VERIFY_FAILED,
    /** Job: quá hạn khắc phục mà chưa nghiệm thu đạt → +1 tần suất, mở vòng mới (actor = hệ thống). */
    OVERDUE
}

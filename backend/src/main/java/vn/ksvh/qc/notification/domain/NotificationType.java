package vn.ksvh.qc.notification.domain;

/**
 * Loại thông báo. DB có CHECK chk_notifications_type (V20261120_1800): thêm loại mới phải viết migration
 * cập nhật ràng buộc đó, nếu không lưu thông báo sẽ lỗi.
 */
public enum NotificationType {
    PLAN_SUBMITTED,
    PLAN_APPROVED,
    PLAN_REJECTED,
    INSPECTION_ASSIGNED,
    INSPECTION_SUBMITTED,
    FINDING_APPEALED,
    APPEAL_MEETING_REQUIRED,
    FINDING_APPEAL_CONCLUDED,
    REMEDIATION_SUBMITTED,
    FINDING_VERIFIED,
    FINDING_REMINDER_DUE,
    FINDING_OVERDUE,
    FINDING_M4_ALERT,
    SYSTEM
}

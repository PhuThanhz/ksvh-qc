package vn.ksvh.qc.shared.audit;

import java.time.Instant;

/**
 * Sự kiện kiểm toán / nhật ký hệ thống ghi nhận thao tác của người dùng.
 * Đặt tại shared để mọi module có thể publish sự kiện mà không gây phụ thuộc vòng.
 */
public record AuditLogEvent(
        Long userId,
        String username,
        String userFullName,
        String action,
        String targetType,
        String targetId,
        String summary,
        String ipAddress,
        String details,
        Instant timestamp
) {
    public static AuditLogEvent of(
            Long userId,
            String username,
            String userFullName,
            String action,
            String targetType,
            String targetId,
            String summary,
            String details
    ) {
        return new AuditLogEvent(
                userId,
                username,
                userFullName,
                action,
                targetType,
                targetId,
                summary,
                null,
                details,
                Instant.now()
        );
    }

    public static AuditLogEvent of(
            Long userId,
            String action,
            String targetType,
            String targetId,
            String summary
    ) {
        return of(userId, null, null, action, targetType, targetId, summary, null);
    }
}

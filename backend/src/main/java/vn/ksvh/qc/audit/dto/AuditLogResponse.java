package vn.ksvh.qc.audit.dto;

import java.time.Instant;
import vn.ksvh.qc.audit.domain.AuditLog;

public record AuditLogResponse(
        Long id,
        Instant createdAt,
        Long userId,
        String username,
        String userFullName,
        String action,
        String targetType,
        String targetId,
        String summary,
        String ipAddress,
        String details
) {
    public static AuditLogResponse from(AuditLog entity) {
        return new AuditLogResponse(
                entity.getId(),
                entity.getCreatedAt(),
                entity.getUserId(),
                entity.getUsername(),
                entity.getUserFullName(),
                entity.getAction(),
                entity.getTargetType(),
                entity.getTargetId(),
                entity.getSummary(),
                entity.getIpAddress(),
                entity.getDetails()
        );
    }
}

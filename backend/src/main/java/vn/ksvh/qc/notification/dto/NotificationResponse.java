package vn.ksvh.qc.notification.dto;

import vn.ksvh.qc.notification.domain.Notification;
import vn.ksvh.qc.notification.domain.NotificationType;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        NotificationType type,
        String title,
        String body,
        String link,
        Instant readAt,
        boolean read,
        Instant createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType(),
                n.getTitle(),
                n.getBody(),
                n.getLink(),
                n.getReadAt(),
                n.getReadAt() != null,
                n.getCreatedAt()
        );
    }
}

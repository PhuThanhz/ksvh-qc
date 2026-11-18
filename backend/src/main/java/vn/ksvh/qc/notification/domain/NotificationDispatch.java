package vn.ksvh.qc.notification.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.ksvh.qc.shared.persistence.BaseEntity;

import java.time.Instant;

@Entity
@Table(name = "notification_dispatches")
@Getter
@Setter
@NoArgsConstructor
public class NotificationDispatch extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "notification_id")
    private Long notificationId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 20)
    private String channel;

    @Column(nullable = false, length = 150)
    private String recipient;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "retry_count", nullable = false)
    private int retryCount = 0;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @Column(name = "sent_at")
    private Instant sentAt;

    public NotificationDispatch(Long notificationId, Long userId, String channel, String recipient,
                                String title, String content) {
        this.notificationId = notificationId;
        this.userId = userId;
        this.channel = channel;
        this.recipient = recipient;
        this.title = title;
        this.content = content;
        this.status = "PENDING";
        this.retryCount = 0;
    }

    public void markSent() {
        this.status = "SENT";
        this.sentAt = Instant.now();
        this.lastError = null;
    }

    public void markFailed(String error) {
        this.status = "FAILED";
        this.retryCount++;
        this.lastError = error;
    }
}

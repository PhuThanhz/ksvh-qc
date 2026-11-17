package vn.ksvh.qc.notification.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.ksvh.qc.shared.persistence.BaseEntity;

@Entity
@Table(name = "user_notification_preferences")
@Getter
@Setter
@NoArgsConstructor
public class UserNotificationPreference extends BaseEntity {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "email_enabled", nullable = false)
    private boolean emailEnabled = true;

    @Column(name = "zalo_enabled", nullable = false)
    private boolean zaloEnabled = true;

    @Column(name = "custom_email", length = 150)
    private String customEmail;

    @Column(name = "custom_phone", length = 20)
    private String customPhone;

    public UserNotificationPreference(Long userId) {
        this.userId = userId;
        this.emailEnabled = true;
        this.zaloEnabled = true;
    }
}

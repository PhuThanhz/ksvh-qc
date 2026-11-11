package vn.ksvh.qc.auth.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Một refresh token. Các token sinh ra từ cùng một lần đăng nhập chung family_id.
 * Lưu userId (không quan hệ JPA) để không phụ thuộc entity của module user.
 */
@Entity
@Table(name = "refresh_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "family_id", nullable = false)
    private UUID familyId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "family_expires_at", nullable = false)
    private Instant familyExpiresAt;

    @Column(name = "rotated_at")
    private Instant rotatedAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public RefreshToken(Long userId, String tokenHash, UUID familyId, Instant expiresAt, Instant familyExpiresAt,
                        String userAgent, String ipAddress, Instant createdAt) {
        this.userId = userId;
        this.tokenHash = tokenHash;
        this.familyId = familyId;
        this.expiresAt = expiresAt;
        this.familyExpiresAt = familyExpiresAt;
        this.userAgent = userAgent;
        this.ipAddress = ipAddress;
        this.createdAt = createdAt;
    }

    public boolean isUsableAt(Instant now) {
        return revokedAt == null && now.isBefore(expiresAt) && now.isBefore(familyExpiresAt);
    }

    public void markRotated(Instant now) {
        this.rotatedAt = now;
    }
}

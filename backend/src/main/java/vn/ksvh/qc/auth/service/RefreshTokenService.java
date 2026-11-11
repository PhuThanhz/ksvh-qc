package vn.ksvh.qc.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.auth.config.AuthProperties;
import vn.ksvh.qc.auth.domain.RefreshToken;
import vn.ksvh.qc.auth.domain.RefreshTokenRepository;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.util.TokenHashing;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * Vòng đời refresh token: phát hành, xoay vòng (rotation), phát hiện dùng lại, thu hồi.
 * Chỉ lưu SHA-256 của token. Token gốc chỉ tồn tại trong cookie của trình duyệt.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final int TOKEN_BYTES = 32;
    private static final String EXPIRED = "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại";

    private final RefreshTokenRepository repository;
    private final AuthProperties props;
    private final Clock clock;

    public record Issued(String rawToken, Long userId) {
    }

    /** Đăng nhập: mở family mới. */
    @Transactional
    public Issued issueNewFamily(Long userId, ClientInfo client) {
        Instant now = clock.instant();
        return issue(userId, UUID.randomUUID(), now.plus(props.refreshAbsoluteTtl()), client, now);
    }

    /**
     * Làm mới: đổi token cũ lấy token mới cùng family.
     * Token đã bị thay mà dùng lại quá reuseGrace → coi là bị đánh cắp, thu hồi cả family.
     */
    @Transactional(noRollbackFor = BusinessException.class)
    public Issued rotate(String rawToken, ClientInfo client) {
        Instant now = clock.instant();
        RefreshToken current = repository.findByHashForUpdate(TokenHashing.sha256Hex(rawToken))
                .orElseThrow(RefreshTokenService::expired);

        if (!current.isUsableAt(now)) {
            throw expired();
        }
        if (current.getRotatedAt() != null) {
            boolean withinGrace = Duration.between(current.getRotatedAt(), now).compareTo(props.reuseGrace()) <= 0;
            if (!withinGrace) {
                repository.revokeFamily(current.getFamilyId(), now);
                log.warn("Phát hiện dùng lại refresh token đã xoay vòng, thu hồi family {} của user {}",
                        current.getFamilyId(), current.getUserId());
                throw expired();
            }
        } else {
            current.markRotated(now);
        }
        return issue(current.getUserId(), current.getFamilyId(), current.getFamilyExpiresAt(), client, now);
    }

    /** Đăng xuất: thu hồi cả family của token (mọi token sinh từ lần đăng nhập đó). */
    @Transactional
    public void revokeFamilyOf(String rawToken) {
        repository.findByTokenHash(TokenHashing.sha256Hex(rawToken))
                .ifPresent(t -> repository.revokeFamily(t.getFamilyId(), clock.instant()));
    }

    /** Dùng khi khoá tài khoản / đổi mật khẩu / đổi quyền. */
    @Transactional
    public void revokeAllForUser(Long userId) {
        repository.revokeAllForUser(userId, clock.instant());
    }

    /** Dọn token hết hạn tuyệt đối quá 1 ngày, chạy 3h sáng mỗi ngày. */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeExpired() {
        int deleted = repository.deleteExpiredBefore(clock.instant().minus(Duration.ofDays(1)));
        if (deleted > 0) log.info("Đã dọn {} refresh token hết hạn", deleted);
    }

    private Issued issue(Long userId, UUID familyId, Instant familyExpiresAt, ClientInfo client, Instant now) {
        String raw = TokenHashing.randomToken(TOKEN_BYTES);
        Instant expiresAt = min(now.plus(props.refreshTtl()), familyExpiresAt);
        repository.save(new RefreshToken(userId, TokenHashing.sha256Hex(raw), familyId, expiresAt, familyExpiresAt,
                client.userAgent(), client.ipAddress(), now));
        return new Issued(raw, userId);
    }

    private static Instant min(Instant a, Instant b) {
        return a.isBefore(b) ? a : b;
    }

    private static BusinessException expired() {
        return new BusinessException(ErrorCode.AUTH_SESSION_EXPIRED, EXPIRED);
    }
}

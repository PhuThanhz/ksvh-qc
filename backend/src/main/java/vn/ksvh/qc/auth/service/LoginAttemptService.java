package vn.ksvh.qc.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import vn.ksvh.qc.shared.audit.AuditLogEvent;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Quản lý giới hạn số lần đăng nhập sai (Brute-force protection).
 * Khoá tạm thời theo cặp (username + IP) khi sai liên tiếp 5 lần trong 15 phút.
 */
@Slf4j
@Service
public class LoginAttemptService {

    public static final int MAX_ATTEMPTS = 5;
    public static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private final Map<String, AttemptInfo> attempts = new ConcurrentHashMap<>();
    private final ApplicationEventPublisher eventPublisher;

    public LoginAttemptService(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    private record AttemptInfo(int failureCount, Instant firstFailure, Instant lockUntil) {
        boolean isLocked(Instant now) {
            return lockUntil != null && now.isBefore(lockUntil);
        }
    }

    private static String buildKey(String username, String ipAddress) {
        String u = (username == null || username.isBlank()) ? "unknown" : username.trim().toLowerCase();
        String ip = (ipAddress == null || ipAddress.isBlank()) ? "unknown" : ipAddress.trim();
        return u + "@" + ip;
    }

    /**
     * Kiểm tra xem tài khoản/IP có đang trong thời gian bị khoá không.
     * Ném ngoại lệ {@link ErrorCode#AUTH_ACCOUNT_LOCKED} nếu đang bị khoá.
     */
    public void checkAllowed(String username, String ipAddress) {
        String key = buildKey(username, ipAddress);
        AttemptInfo info = attempts.get(key);
        if (info == null) {
            return;
        }

        Instant now = Instant.now();
        if (info.isLocked(now)) {
            long remainingMinutes = Math.max(1, Duration.between(now, info.lockUntil()).toMinutes() + 1);
            throw new BusinessException(
                    ErrorCode.AUTH_ACCOUNT_LOCKED,
                    "Tài khoản hoặc địa chỉ IP đã bị tạm khoá do đăng nhập sai quá 5 lần. Vui lòng thử lại sau "
                            + remainingMinutes + " phút."
            );
        }

        // Hết thời gian khoá hoặc cửa sổ 15 phút đã trôi qua mà chưa đạt ngưỡng -> dọn dẹp
        if (info.lockUntil() != null && !now.isBefore(info.lockUntil())) {
            attempts.remove(key);
        } else if (info.firstFailure() != null && Duration.between(info.firstFailure(), now).compareTo(LOCK_DURATION) > 0) {
            attempts.remove(key);
        }
    }

    /**
     * Ghi nhận một lần đăng nhập thất bại. Nếu đạt ngưỡng {@value #MAX_ATTEMPTS}, khoá tạm thời và ghi log kiểm toán.
     */
    public void recordFailure(String username, String ipAddress) {
        String key = buildKey(username, ipAddress);
        Instant now = Instant.now();

        attempts.compute(key, (k, old) -> {
            if (old == null || (old.firstFailure() != null && Duration.between(old.firstFailure(), now).compareTo(LOCK_DURATION) > 0)) {
                return new AttemptInfo(1, now, null);
            }
            int newCount = old.failureCount() + 1;
            Instant lockUntil = null;
            if (newCount >= MAX_ATTEMPTS) {
                lockUntil = now.plus(LOCK_DURATION);
                log.warn("Đăng nhập sai {} lần liên tiếp cho key '{}'. Tạm khoá đến {}", newCount, key, lockUntil);
                eventPublisher.publishEvent(new AuditLogEvent(
                        null,
                        username,
                        null,
                        "LOGIN_LOCKOUT",
                        "USER",
                        username,
                        "Tài khoản bị tạm khoá do đăng nhập sai " + newCount + " lần liên tiếp từ IP " + ipAddress,
                        ipAddress,
                        "Khoá tạm 15 phút",
                        now
                ));
            }
            return new AttemptInfo(newCount, old.firstFailure(), lockUntil);
        });
    }

    /**
     * Đăng nhập thành công -> xoá bộ đếm thất bại.
     */
    public void recordSuccess(String username, String ipAddress) {
        String key = buildKey(username, ipAddress);
        attempts.remove(key);
    }

    /**
     * Dùng cho test hoặc reset chủ động.
     */
    public void clear(String username, String ipAddress) {
        attempts.remove(buildKey(username, ipAddress));
    }
}

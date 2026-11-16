package vn.ksvh.qc.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import vn.ksvh.qc.user.api.UserSessionsInvalidated;

/**
 * Thu hồi mọi refresh token khi tài khoản bị khoá hoặc đặt lại mật khẩu.
 * Chạy đồng bộ trong cùng transaction với thay đổi tài khoản: lưu thất bại thì không thu hồi.
 * Access token đã cấp vẫn dùng được tới khi hết hạn (tối đa 30 phút).
 */
@Slf4j
@Component
@RequiredArgsConstructor
class UserSessionsListener {

    private final RefreshTokenService refreshTokens;

    @EventListener
    void on(UserSessionsInvalidated event) {
        refreshTokens.revokeAllForUser(event.userId());
        log.info("Đã thu hồi phiên đăng nhập của user #{}", event.userId());
    }
}

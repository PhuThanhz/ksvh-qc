package vn.ksvh.qc.user.api;

/**
 * Sự kiện: phiên đăng nhập của người dùng không còn hợp lệ (bị khoá, đặt lại mật khẩu).
 * Module auth nghe sự kiện này để thu hồi refresh token, tránh phụ thuộc vòng user → auth.
 */
public record UserSessionsInvalidated(Long userId) {
}

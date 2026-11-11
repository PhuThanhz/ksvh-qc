package vn.ksvh.qc.auth.dto;

/** Trả về khi đăng nhập/làm mới. Refresh token KHÔNG nằm ở đây mà trong cookie HttpOnly. */
public record SessionResponse(String accessToken, long expiresIn, SessionUser user) {
}

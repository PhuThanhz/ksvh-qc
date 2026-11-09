package vn.ksvh.qc.auth.dto;

public record TokenResponse(String accessToken, String refreshToken, long expiresIn, UserInfo user) {
}

package vn.ksvh.qc.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

/**
 * @param refreshTtl         hạn của một refresh token (trượt sau mỗi lần làm mới)
 * @param refreshAbsoluteTtl hạn tối đa của cả phiên kể từ lúc đăng nhập
 * @param reuseGrace         khoảng cho phép dùng lại token vừa bị thay (request trùng do mạng)
 * @param allowedOrigins     Origin hợp lệ cho refresh/logout; rỗng = bỏ qua kiểm tra Origin (chỉ dev)
 */
@ConfigurationProperties(prefix = "app.auth")
public record AuthProperties(Duration refreshTtl, Duration refreshAbsoluteTtl, Duration reuseGrace,
                             Cookie cookie, List<String> allowedOrigins) {

    public record Cookie(String name, String path, boolean secure, String sameSite) {
    }
}

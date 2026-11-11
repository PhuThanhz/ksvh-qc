package vn.ksvh.qc.shared.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

/**
 * Cấu hình tầng web (CORS).
 *
 * @param cors cấu hình CORS cho trình duyệt khi frontend gọi khác origin
 */
@ConfigurationProperties(prefix = "app.web")
public record WebProperties(Cors cors) {

    public record Cors(List<String> allowedOrigins, Duration maxAge) {
    }
}

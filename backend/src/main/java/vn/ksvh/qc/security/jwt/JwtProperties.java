package vn.ksvh.qc.security.jwt;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/** Cấu hình access token. secret tối thiểu 32 ký tự (HS256). */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(String secret, String issuer, Duration accessTtl) {
}

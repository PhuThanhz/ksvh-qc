package vn.ksvh.qc.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/** Cấu hình JWT. secret phải dài tối thiểu 32 ký tự (HS256). */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(String secret, Duration accessTtl, Duration refreshTtl, String issuer) {
}

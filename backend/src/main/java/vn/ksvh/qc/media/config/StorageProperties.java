package vn.ksvh.qc.media.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/** Kho ảnh S3/MinIO. publicEndpoint là địa chỉ trình duyệt dùng để upload (khớp chữ ký presigned URL). */
@ConfigurationProperties(prefix = "app.storage")
public record StorageProperties(String endpoint, String publicEndpoint, String region, String bucket,
                                String accessKey, String secretKey, Duration presignTtl, long maxUploadBytes) {
}

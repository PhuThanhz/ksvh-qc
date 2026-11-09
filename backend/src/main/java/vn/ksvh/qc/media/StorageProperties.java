package vn.ksvh.qc.media;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/** Cấu hình kho ảnh S3/MinIO. publicEndpoint là địa chỉ điện thoại truy cập được để upload. */
@ConfigurationProperties(prefix = "app.storage")
public record StorageProperties(String endpoint, String publicEndpoint, String region, String bucket,
                                String accessKey, String secretKey, Duration presignTtl, long maxUploadBytes) {
}

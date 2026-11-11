package vn.ksvh.qc.media.dto;

import java.time.Instant;

/** Client PUT file lên uploadUrl (kèm Content-Type), rồi gửi objectKey cho API nghiệp vụ. */
public record PresignUploadResponse(String uploadUrl, String objectKey, Instant expiresAt) {
}

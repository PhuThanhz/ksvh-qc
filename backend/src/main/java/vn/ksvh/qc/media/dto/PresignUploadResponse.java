package vn.ksvh.qc.media.dto;

import java.time.Instant;

/** Client PUT file lên uploadUrl (kèm header Content-Type), rồi gửi objectKey về API nghiệp vụ. */
public record PresignUploadResponse(String uploadUrl, String objectKey, Instant expiresAt) {
}

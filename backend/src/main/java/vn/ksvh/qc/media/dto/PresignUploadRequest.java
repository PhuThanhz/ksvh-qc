package vn.ksvh.qc.media.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public record PresignUploadRequest(
        @NotBlank(message = "Thiếu định dạng tệp bằng chứng")
        @Pattern(regexp = "image/(jpeg|png|webp)|video/(mp4|quicktime)", message = "Chỉ nhận ảnh (JPEG, PNG, WEBP) hoặc video (MP4, MOV)")
        String contentType,
        @Positive(message = "Dung lượng tệp phải lớn hơn 0") long sizeBytes) {
}

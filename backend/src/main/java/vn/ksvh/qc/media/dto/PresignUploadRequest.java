package vn.ksvh.qc.media.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public record PresignUploadRequest(
        @NotBlank(message = "Thiếu loại ảnh") @Pattern(regexp = "image/(jpeg|png|webp)", message = "Chỉ nhận ảnh JPEG, PNG hoặc WEBP")
        String contentType,
        @Positive(message = "Dung lượng ảnh phải lớn hơn 0") long sizeBytes) {
}

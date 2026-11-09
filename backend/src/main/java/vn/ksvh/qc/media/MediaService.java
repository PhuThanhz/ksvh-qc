package vn.ksvh.qc.media;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import vn.ksvh.qc.media.dto.PresignUploadRequest;
import vn.ksvh.qc.media.dto.PresignUploadResponse;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MediaService {

    private static final Map<String, String> EXT = Map.of(
            "image/jpeg", "jpg", "image/png", "png", "image/webp", "webp");

    private final S3Presigner presigner;
    private final StorageProperties props;

    /** Tạo link upload 1 lần cho ảnh. Key do server sinh, client không tự đặt tên file. */
    public PresignUploadResponse presignUpload(PresignUploadRequest req, String username) {
        if (req.sizeBytes() > props.maxUploadBytes()) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Ảnh vượt quá dung lượng cho phép");
        }
        LocalDate today = LocalDate.now();
        String key = "photos/%d/%02d/%s/%s.%s".formatted(today.getYear(), today.getMonthValue(),
                username, UUID.randomUUID(), EXT.get(req.contentType()));

        PutObjectRequest put = PutObjectRequest.builder()
                .bucket(props.bucket())
                .key(key)
                .contentType(req.contentType())
                .build();
        PresignedPutObjectRequest presigned = presigner.presignPutObject(p -> p
                .signatureDuration(props.presignTtl())
                .putObjectRequest(put));
        return new PresignUploadResponse(presigned.url().toString(), key, presigned.expiration());
    }
}

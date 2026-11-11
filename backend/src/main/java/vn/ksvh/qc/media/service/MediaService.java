package vn.ksvh.qc.media.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import vn.ksvh.qc.media.config.StorageProperties;
import vn.ksvh.qc.media.dto.PresignUploadRequest;
import vn.ksvh.qc.media.dto.PresignUploadResponse;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MediaService {

    private static final Map<String, String> EXT = Map.of("image/jpeg", "jpg", "image/png", "png", "image/webp", "webp");

    private final S3Presigner presigner;
    private final StorageProperties props;
    private final Clock clock;

    /** Link upload một lần. Object key do server sinh, client không tự đặt đường dẫn. */
    public PresignUploadResponse presignUpload(PresignUploadRequest req, Long userId) {
        if (req.sizeBytes() > props.maxUploadBytes()) {
            throw new BusinessException(ErrorCode.PAYLOAD_TOO_LARGE, "Ảnh vượt quá dung lượng cho phép");
        }
        LocalDate today = LocalDate.ofInstant(clock.instant(), ZoneOffset.UTC);
        String key = "photos/%d/%02d/u%d/%s.%s".formatted(today.getYear(), today.getMonthValue(), userId,
                UUID.randomUUID(), EXT.get(req.contentType()));

        PutObjectRequest put = PutObjectRequest.builder()
                .bucket(props.bucket()).key(key).contentType(req.contentType()).build();
        var presigned = presigner.presignPutObject(p -> p.signatureDuration(props.presignTtl()).putObjectRequest(put));
        return new PresignUploadResponse(presigned.url().toString(), key, presigned.expiration());
    }
}

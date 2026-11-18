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

    private static final Map<String, String> EXT = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp",
            "video/mp4", "mp4",
            "video/quicktime", "mov"
    );

    /** Giới hạn dung lượng video mặc định 50 MB (~60s), chờ KSVH xác nhận */
    public static final long MAX_VIDEO_BYTES = 52428800L;

    private final S3Presigner presigner;
    private final StorageProperties props;
    private final Clock clock;

    /** Link upload một lần. Object key do server sinh, client không tự đặt đường dẫn. */
    public PresignUploadResponse presignUpload(PresignUploadRequest req, Long userId) {
        boolean isVideo = req.contentType() != null && req.contentType().startsWith("video/");
        long maxBytes = isVideo ? MAX_VIDEO_BYTES : props.maxUploadBytes();
        if (req.sizeBytes() > maxBytes) {
            String msg = isVideo
                    ? "Video vượt quá dung lượng cho phép (tối đa 50MB, ~60 giây, chờ KSVH xác nhận)"
                    : "Ảnh vượt quá dung lượng cho phép (tối đa 10MB)";
            throw new BusinessException(ErrorCode.PAYLOAD_TOO_LARGE, msg);
        }
        LocalDate today = LocalDate.ofInstant(clock.instant(), ZoneOffset.UTC);
        String folder = isVideo ? "videos" : "photos";
        String key = "%s/%d/%02d/u%d/%s.%s".formatted(folder, today.getYear(), today.getMonthValue(), userId,
                UUID.randomUUID(), EXT.get(req.contentType()));

        PutObjectRequest put = PutObjectRequest.builder()
                .bucket(props.bucket()).key(key).contentType(req.contentType()).build();
        var presigned = presigner.presignPutObject(p -> p.signatureDuration(props.presignTtl()).putObjectRequest(put));
        return new PresignUploadResponse(presigned.url().toString(), key, presigned.expiration());
    }
}

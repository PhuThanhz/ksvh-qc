package vn.ksvh.qc.media.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.media.api.EvidenceApi;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
class EvidenceService implements EvidenceApi {

    /** Khớp định dạng key do MediaService.presignUpload sinh: photos/yyyy/MM/u{userId}/{uuid}.{ext}. */
    private static final Pattern KEY = Pattern.compile(
            "^photos/\\d{4}/\\d{2}/u(\\d+)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|webp)$");
    private static final int MAX_FILES = 20;

    private final ObjectStore store;

    @Override
    public String requireUploaded(String raw, Long uploaderId) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        List<String> keys = Arrays.stream(raw.split(",")).map(String::trim).filter(StringUtils::hasText).distinct().toList();
        if (keys.isEmpty()) {
            return null;
        }
        if (keys.size() > MAX_FILES) {
            throw invalid("Tối đa %d ảnh bằng chứng cho mỗi lần gửi".formatted(MAX_FILES));
        }
        for (String key : keys) {
            Matcher m = KEY.matcher(key);
            if (!m.matches()) {
                throw invalid("Ảnh bằng chứng phải được chụp/tải lên qua ứng dụng (không nhận đường dẫn ngoài)");
            }
            if (uploaderId == null || !m.group(1).equals(String.valueOf(uploaderId))) {
                throw invalid("Ảnh bằng chứng phải do chính người gửi tải lên");
            }
            boolean exists;
            try {
                exists = store.exists(key);
            } catch (RuntimeException e) {
                throw new BusinessException(ErrorCode.EVIDENCE_INVALID,
                        "Không kiểm tra được ảnh bằng chứng trên kho lưu trữ, vui lòng thử lại");
            }
            if (!exists) {
                throw invalid("Ảnh bằng chứng chưa tải lên xong hoặc không tồn tại, vui lòng chụp/tải lại");
            }
        }
        return String.join(", ", keys);
    }

    private static BusinessException invalid(String message) {
        return new BusinessException(ErrorCode.EVIDENCE_INVALID, message);
    }
}

package vn.ksvh.qc.media.api;

/**
 * Kiểm tra ảnh/video bằng chứng do client gửi kèm (CLAUDE.md quy tắc 3): chỉ chấp nhận object key do server cấp
 * qua presign-upload, của chính người gửi, và object phải thực sự tồn tại trong kho lưu trữ.
 */
public interface EvidenceApi {

    /**
     * @param raw        chuỗi key cách nhau bởi dấu phẩy (có thể rỗng)
     * @param uploaderId người đang gửi – phải trùng người đã upload
     * @return chuỗi key đã chuẩn hoá ("k1, k2"), hoặc {@code null} nếu rỗng
     * @throws vn.ksvh.qc.shared.error.BusinessException mã EVIDENCE_INVALID nếu có key không hợp lệ
     */
    String requireUploaded(String raw, Long uploaderId);
}

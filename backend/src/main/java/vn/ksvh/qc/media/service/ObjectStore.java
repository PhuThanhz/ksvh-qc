package vn.ksvh.qc.media.service;

/** Truy vấn kho lưu trữ (S3/MinIO). Tách interface để test thay bằng bản giả, không cần MinIO. */
public interface ObjectStore {

    /** Object có tồn tại không. Lỗi kết nối kho → ném ngoại lệ (không coi là "không tồn tại"). */
    boolean exists(String key);
}

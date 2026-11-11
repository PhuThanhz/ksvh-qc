package vn.ksvh.qc.shared.error;

/** Lỗi nghiệp vụ có chủ đích. message là câu tiếng Việt hiển thị được cho người dùng. */
public class BusinessException extends RuntimeException {

    private final ErrorCode code;

    public BusinessException(ErrorCode code, String message) {
        super(message);
        this.code = code;
    }

    public ErrorCode code() {
        return code;
    }
}

package vn.ksvh.qc.shared.error;

import org.springframework.http.HttpStatus;

/**
 * Mã lỗi máy đọc được, trả trong trường "code" của ProblemDetail.
 * Frontend xử lý theo code, không theo câu chữ. Thêm mã mới theo dạng MODULE_LY_DO.
 */
public enum ErrorCode {
    BAD_REQUEST(HttpStatus.BAD_REQUEST),
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED),
    AUTH_INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
    AUTH_SESSION_EXPIRED(HttpStatus.UNAUTHORIZED),
    AUTH_CSRF_REJECTED(HttpStatus.FORBIDDEN),
    ACCESS_DENIED(HttpStatus.FORBIDDEN),
    NOT_FOUND(HttpStatus.NOT_FOUND),
    CONFLICT(HttpStatus.CONFLICT),
    PAYLOAD_TOO_LARGE(HttpStatus.CONTENT_TOO_LARGE),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }

    public HttpStatus status() {
        return status;
    }

    /** Mã mặc định khi Spring tự sinh lỗi (không đi qua BusinessException). */
    public static ErrorCode fromStatus(int status) {
        return switch (status) {
            case 400 -> BAD_REQUEST;
            case 401 -> UNAUTHENTICATED;
            case 403 -> ACCESS_DENIED;
            case 404 -> NOT_FOUND;
            case 409 -> CONFLICT;
            case 413 -> PAYLOAD_TOO_LARGE;
            case 415 -> UNSUPPORTED_MEDIA_TYPE;
            default -> status >= 500 ? INTERNAL_ERROR : BAD_REQUEST;
        };
    }
}

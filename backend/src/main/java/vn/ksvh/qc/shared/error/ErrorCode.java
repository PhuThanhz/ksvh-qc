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
    EXCEL_INVALID_FILE(HttpStatus.BAD_REQUEST),
    ORGANIZATION_CODE_TAKEN(HttpStatus.CONFLICT),
    ORGANIZATION_INVALID_ASSIGNEE(HttpStatus.BAD_REQUEST),
    ORGANIZATION_GPS_REQUIRED(HttpStatus.BAD_REQUEST),
    ORGANIZATION_COMPANY_INACTIVE(HttpStatus.BAD_REQUEST),
    USER_USERNAME_TAKEN(HttpStatus.CONFLICT),
    USER_SELF_LOCKOUT(HttpStatus.BAD_REQUEST),
    USER_LAST_ADMIN(HttpStatus.BAD_REQUEST),
    ROLE_CODE_TAKEN(HttpStatus.CONFLICT),
    ROLE_UNKNOWN(HttpStatus.BAD_REQUEST),
    ROLE_SYSTEM_PROTECTED(HttpStatus.BAD_REQUEST),
    ROLE_IN_USE(HttpStatus.CONFLICT),
    PERMISSION_UNKNOWN(HttpStatus.BAD_REQUEST),
    EMPLOYEE_CODE_TAKEN(HttpStatus.CONFLICT),
    EMPLOYEE_INVALID_ORG_UNIT(HttpStatus.BAD_REQUEST),
    EMPLOYEE_INVALID_ACCOUNT(HttpStatus.BAD_REQUEST),
    EMPLOYEE_ACCOUNT_LINKED(HttpStatus.CONFLICT),
    CRITERIA_CODE_TAKEN(HttpStatus.CONFLICT),
    CRITERIA_INVALID_REFERENCE(HttpStatus.BAD_REQUEST),
    CRITERIA_IN_USE(HttpStatus.CONFLICT),
    RISK_LEVELS_INVALID(HttpStatus.BAD_REQUEST),
    RISK_LEVEL_NOT_CONFIGURED(HttpStatus.CONFLICT),
    CONCURRENT_UPDATE(HttpStatus.CONFLICT),
    INSPECTION_CODE_TAKEN(HttpStatus.CONFLICT),
    INSPECTION_INVALID_STATE(HttpStatus.CONFLICT),
    INSPECTION_CHECKIN_REJECTED(HttpStatus.BAD_REQUEST),
    INSPECTION_INCOMPLETE(HttpStatus.BAD_REQUEST),
    FINDING_INVALID_STATE(HttpStatus.CONFLICT),
    CONFIG_EFFECTIVE_DATE_INVALID(HttpStatus.BAD_REQUEST),
    CONFIG_ALREADY_EFFECTIVE(HttpStatus.BAD_REQUEST),
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

package vn.ksvh.qc.shared.error;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.core.PropertyReferenceException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Mọi lỗi API trả ProblemDetail (RFC 9457) kèm "code", "traceId" và "errors" (lỗi theo trường).
 * Lỗi ở tầng filter bảo mật (401/403) do security.ProblemSecurityHandlers xử lý.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ProblemDetail> handleBusiness(BusinessException ex) {
        return ResponseEntity.status(ex.code().status()).body(ProblemDetails.of(ex.code(), ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ProblemDetail> handleAccessDenied(AccessDeniedException ex) {
        ErrorCode code = ErrorCode.ACCESS_DENIED;
        return ResponseEntity.status(code.status()).body(ProblemDetails.of(code, "Bạn không có quyền thực hiện thao tác này"));
    }

    @ExceptionHandler(PropertyReferenceException.class)
    public ResponseEntity<ProblemDetail> handleBadSort(PropertyReferenceException ex) {
        ErrorCode code = ErrorCode.BAD_REQUEST;
        return ResponseEntity.status(code.status()).body(ProblemDetails.of(code, "Trường sắp xếp không hợp lệ"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(Exception ex) {
        log.error("Lỗi không mong đợi", ex);
        ErrorCode code = ErrorCode.INTERNAL_ERROR;
        return ResponseEntity.status(code.status()).body(ProblemDetails.of(code, "Hệ thống gặp sự cố, vui lòng thử lại sau"));
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                                                                  HttpHeaders headers, HttpStatusCode status,
                                                                  WebRequest request) {
        ProblemDetail pd = ProblemDetails.of(ErrorCode.VALIDATION_FAILED, "Dữ liệu không hợp lệ");
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(fe -> errors.putIfAbsent(fe.getField(), fe.getDefaultMessage()));
        pd.setProperty("errors", errors);
        return handleExceptionInternal(ex, pd, headers, ErrorCode.VALIDATION_FAILED.status(), request);
    }

    /** Lỗi chuẩn của Spring MVC (JSON hỏng, sai method...) cũng được gắn code + traceId. */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers,
                                                             HttpStatusCode statusCode, WebRequest request) {
        if (body instanceof ProblemDetail pd
                && (pd.getProperties() == null || !pd.getProperties().containsKey("code"))) {
            ProblemDetails.enrich(pd, ErrorCode.fromStatus(statusCode.value()));
        }
        return super.handleExceptionInternal(ex, body, headers, statusCode, request);
    }
}

package vn.ksvh.qc.auth.web;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import vn.ksvh.qc.auth.config.AuthProperties;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;

/**
 * Chống CSRF cho 2 endpoint xác thực bằng cookie (refresh, logout):
 * SameSite=Strict + bắt buộc header X-Requested-With + Origin nằm trong danh sách cho phép.
 */
@Component
@RequiredArgsConstructor
class RefreshRequestGuard {

    static final String HEADER = "X-Requested-With";
    static final String EXPECTED = "XMLHttpRequest";

    private final AuthProperties props;

    void check(HttpServletRequest request) {
        if (!EXPECTED.equals(request.getHeader(HEADER))) {
            throw rejected();
        }
        String origin = request.getHeader("Origin");
        boolean checkOrigin = props.allowedOrigins() != null && !props.allowedOrigins().isEmpty();
        if (checkOrigin && origin != null && !props.allowedOrigins().contains(origin)) {
            throw rejected();
        }
    }

    private static BusinessException rejected() {
        return new BusinessException(ErrorCode.AUTH_CSRF_REJECTED, "Yêu cầu không hợp lệ");
    }
}

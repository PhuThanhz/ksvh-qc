package vn.ksvh.qc.security;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.ProblemDetails;

import java.io.IOException;

/** Lỗi 401/403 ở tầng filter bảo mật cũng trả ProblemDetail giống lỗi trong controller. */
@Component
@RequiredArgsConstructor
public class ProblemSecurityHandlers {

    private final JsonMapper jsonMapper;

    public AuthenticationEntryPoint entryPoint() {
        return (request, response, ex) ->
                write(response, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập để tiếp tục");
    }

    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, ex) ->
                write(response, ErrorCode.ACCESS_DENIED, "Bạn không có quyền thực hiện thao tác này");
    }

    private void write(HttpServletResponse response, ErrorCode code, String detail) throws IOException {
        ProblemDetail pd = ProblemDetails.of(code, detail);
        response.setStatus(code.status().value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        jsonMapper.writeValue(response.getOutputStream(), pd);
    }
}

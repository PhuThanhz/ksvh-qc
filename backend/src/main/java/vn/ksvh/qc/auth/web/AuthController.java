package vn.ksvh.qc.auth.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.WebUtils;
import vn.ksvh.qc.auth.dto.LoginRequest;
import vn.ksvh.qc.auth.dto.SessionResponse;
import vn.ksvh.qc.auth.dto.SessionUser;
import vn.ksvh.qc.auth.service.AuthService;
import vn.ksvh.qc.auth.service.ClientInfo;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.web.ApiPaths;

@RestController
@RequestMapping(ApiPaths.V1 + "/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RefreshCookies cookies;
    private final RefreshRequestGuard guard;

    @PostMapping("/login")
    public ResponseEntity<SessionResponse> login(@Valid @RequestBody LoginRequest req, HttpServletRequest request) {
        AuthService.AuthResult result = authService.login(req.username(), req.password(), client(request));
        return withCookie(result);
    }

    @PostMapping("/refresh")
    public ResponseEntity<SessionResponse> refresh(HttpServletRequest request, HttpServletResponse response) {
        guard.check(request);
        String raw = readCookie(request);
        if (raw == null) {
            throw new BusinessException(ErrorCode.AUTH_SESSION_EXPIRED, "Phiên đăng nhập đã hết hạn");
        }
        try {
            return withCookie(authService.refresh(raw, client(request)));
        } catch (BusinessException e) {
            response.addHeader(HttpHeaders.SET_COOKIE, cookies.clear().toString());
            throw e;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        guard.check(request);
        authService.logout(readCookie(request));
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookies.clear().toString()).build();
    }

    @GetMapping("/me")
    public SessionUser me(@AuthenticationPrincipal Jwt jwt) {
        return authService.me(CurrentUser.from(jwt).id());
    }

    private ResponseEntity<SessionResponse> withCookie(AuthService.AuthResult result) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookies.create(result.refreshToken()).toString())
                .body(result.session());
    }

    private String readCookie(HttpServletRequest request) {
        var cookie = WebUtils.getCookie(request, cookies.name());
        return cookie == null || cookie.getValue().isBlank() ? null : cookie.getValue();
    }

    private static ClientInfo client(HttpServletRequest request) {
        return new ClientInfo(request.getHeader(HttpHeaders.USER_AGENT), request.getRemoteAddr());
    }
}

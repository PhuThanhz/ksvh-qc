package vn.ksvh.qc.auth.web;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import vn.ksvh.qc.auth.config.AuthProperties;

/** Tạo/xoá cookie refresh token: HttpOnly, Secure, SameSite=Strict, chỉ gửi tới /api/v1/auth. */
@Component
@RequiredArgsConstructor
class RefreshCookies {

    private final AuthProperties props;

    String name() {
        return props.cookie().name();
    }

    ResponseCookie create(String rawToken) {
        return base(rawToken).maxAge(props.refreshTtl()).build();
    }

    ResponseCookie clear() {
        return base("").maxAge(0).build();
    }

    private ResponseCookie.ResponseCookieBuilder base(String value) {
        AuthProperties.Cookie c = props.cookie();
        return ResponseCookie.from(c.name(), value)
                .httpOnly(true)
                .secure(c.secure())
                .sameSite(c.sameSite())
                .path(c.path());
    }
}

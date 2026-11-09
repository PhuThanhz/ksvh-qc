package vn.ksvh.qc.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.auth.dto.TokenResponse;
import vn.ksvh.qc.auth.dto.UserInfo;
import vn.ksvh.qc.common.NotFoundException;
import vn.ksvh.qc.security.JwtService;
import vn.ksvh.qc.user.User;
import vn.ksvh.qc.user.UserRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private static final String INVALID = "Sai tên đăng nhập hoặc mật khẩu";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public TokenResponse login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .filter(User::isActive)
                .orElseThrow(() -> new BadCredentialsException(INVALID));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadCredentialsException(INVALID);
        }
        return issue(user);
    }

    public TokenResponse refresh(String refreshToken) {
        Jwt jwt;
        try {
            jwt = jwtService.decodeRefreshToken(refreshToken);
        } catch (JwtException e) {
            throw new BadCredentialsException("Refresh token không hợp lệ hoặc đã hết hạn");
        }
        User user = userRepository.findByUsername(jwt.getSubject())
                .filter(User::isActive)
                .orElseThrow(() -> new BadCredentialsException("Tài khoản không còn hoạt động"));
        return issue(user);
    }

    public UserInfo me(String username) {
        return userRepository.findByUsername(username).map(UserInfo::from)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
    }

    private TokenResponse issue(User user) {
        return new TokenResponse(jwtService.createAccessToken(user), jwtService.createRefreshToken(user),
                jwtService.accessTtlSeconds(), UserInfo.from(user));
    }
}

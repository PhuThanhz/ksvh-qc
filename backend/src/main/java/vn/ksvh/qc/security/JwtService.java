package vn.ksvh.qc.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import vn.ksvh.qc.user.User;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JwtService {

    public static final String CLAIM_TYPE = "typ";
    public static final String CLAIM_ROLES = "roles";
    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    private final JwtEncoder encoder;
    private final JwtDecoder decoder;
    private final JwtProperties props;

    public String createAccessToken(User user) {
        return create(user, TYPE_ACCESS, props.accessTtl());
    }

    public String createRefreshToken(User user) {
        return create(user, TYPE_REFRESH, props.refreshTtl());
    }

    /** Giải mã refresh token; ném JwtException nếu sai chữ ký, hết hạn hoặc không phải refresh token. */
    public Jwt decodeRefreshToken(String token) {
        Jwt jwt = decoder.decode(token);
        if (!TYPE_REFRESH.equals(jwt.getClaimAsString(CLAIM_TYPE))) {
            throw new BadJwtException("Không phải refresh token");
        }
        return jwt;
    }

    public long accessTtlSeconds() {
        return props.accessTtl().toSeconds();
    }

    private String create(User user, String type, Duration ttl) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(props.issuer())
                .issuedAt(now)
                .expiresAt(now.plus(ttl))
                .subject(user.getUsername())
                .claim("uid", user.getId())
                .claim(CLAIM_TYPE, type)
                .claim(CLAIM_ROLES, List.of(user.getRole().name()))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}

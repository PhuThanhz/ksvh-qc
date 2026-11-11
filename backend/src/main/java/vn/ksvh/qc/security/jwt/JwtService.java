package vn.ksvh.qc.security.jwt;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

/** Phát hành access token (JWT ngắn hạn). Refresh token KHÔNG phải JWT, xem module auth. */
@Service
@RequiredArgsConstructor
public class JwtService {

    public static final String CLAIM_TYPE = "typ";
    public static final String CLAIM_UID = "uid";
    public static final String CLAIM_ROLES = "roles";
    public static final String CLAIM_PERMISSIONS = "perms";
    public static final String TYPE_ACCESS = "access";

    private final JwtEncoder encoder;
    private final JwtProperties props;
    private final Clock clock;

    public String createAccessToken(AccessTokenSubject subject) {
        Instant now = clock.instant();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(props.issuer())
                .issuedAt(now)
                .expiresAt(now.plus(props.accessTtl()))
                .subject(subject.username())
                .claim(CLAIM_UID, subject.userId())
                .claim(CLAIM_TYPE, TYPE_ACCESS)
                .claim(CLAIM_ROLES, List.copyOf(subject.roles()))
                .claim(CLAIM_PERMISSIONS, List.copyOf(subject.permissions()))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public long accessTtlSeconds() {
        return props.accessTtl().toSeconds();
    }
}

package vn.ksvh.qc.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import vn.ksvh.qc.security.jwt.JwtService;

import java.util.Optional;

/**
 * Cấu hình Spring Data JPA Auditing: tự động điền createdBy và updatedBy từ JWT user id.
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class JpaAuditingConfig {

    @Bean
    public AuditorAware<Long> auditorAware() {
        return () -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return Optional.empty();
            }
            Object principal = auth.getPrincipal();
            if (principal instanceof Jwt jwt) {
                Number uid = jwt.getClaim(JwtService.CLAIM_UID);
                if (uid != null) {
                    return Optional.of(uid.longValue());
                }
            }
            return Optional.empty();
        };
    }
}

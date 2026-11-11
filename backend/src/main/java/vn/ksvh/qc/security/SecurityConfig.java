package vn.ksvh.qc.security;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import vn.ksvh.qc.security.jwt.JwtProperties;
import vn.ksvh.qc.security.jwt.JwtService;
import vn.ksvh.qc.shared.web.ApiPaths;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;

@Configuration
@EnableMethodSecurity
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfig {

    /** Endpoint xác thực bằng cookie/mật khẩu: không đọc Bearer token (token cũ hết hạn không được làm hỏng refresh). */
    private static final String[] AUTH_ENDPOINTS = {
            ApiPaths.V1 + "/auth/login", ApiPaths.V1 + "/auth/refresh", ApiPaths.V1 + "/auth/logout"
    };

    /** Endpoint không cần access token. refresh/logout tự xác thực bằng cookie + kiểm tra CSRF riêng. */
    private static final String[] PUBLIC = {
            AUTH_ENDPOINTS[0], AUTH_ENDPOINTS[1], AUTH_ENDPOINTS[2],
            "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**", "/actuator/health/**"
    };

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, ProblemSecurityHandlers handlers) throws Exception {
        http
                .cors(Customizer.withDefaults())
                // API dùng Bearer token; 2 endpoint dùng cookie (refresh/logout) có RefreshRequestGuard chống CSRF.
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers
                        .contentTypeOptions(Customizer.withDefaults())
                        .frameOptions(frame -> frame.deny()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC).permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(o -> o
                        .bearerTokenResolver(bearerTokenResolver())
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                        .authenticationEntryPoint(handlers.entryPoint())
                        .accessDeniedHandler(handlers.accessDeniedHandler()))
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(handlers.entryPoint())
                        .accessDeniedHandler(handlers.accessDeniedHandler()));
        return http.build();
    }

    /** Bỏ qua header Authorization ở các endpoint xác thực; còn lại đọc Bearer token như bình thường. */
    private static BearerTokenResolver bearerTokenResolver() {
        DefaultBearerTokenResolver delegate = new DefaultBearerTokenResolver();
        Set<String> skip = Set.of(AUTH_ENDPOINTS);
        return request -> skip.contains(request.getRequestURI()) ? null : delegate.resolve(request);
    }

    /** Mặc định bcrypt, có tiền tố {id} để sau này đổi thuật toán không phải reset mật khẩu. */
    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    JwtEncoder jwtEncoder(JwtProperties props) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(secretKey(props)));
    }

    @Bean
    JwtDecoder jwtDecoder(JwtProperties props) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(secretKey(props))
                .macAlgorithm(MacAlgorithm.HS256).build();
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(props.issuer()));
        return decoder;
    }

    /** Authorities = permission (vd "audit:approve") + ROLE_<role>. Chỉ chấp nhận access token. */
    private static JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            if (!JwtService.TYPE_ACCESS.equals(jwt.getClaimAsString(JwtService.CLAIM_TYPE))) {
                throw new BadJwtException("Phải dùng access token");
            }
            Collection<GrantedAuthority> authorities = new ArrayList<>();
            List<String> perms = jwt.getClaimAsStringList(JwtService.CLAIM_PERMISSIONS);
            List<String> roles = jwt.getClaimAsStringList(JwtService.CLAIM_ROLES);
            if (perms != null) perms.forEach(p -> authorities.add(new SimpleGrantedAuthority(p)));
            if (roles != null) roles.forEach(r -> authorities.add(new SimpleGrantedAuthority("ROLE_" + r)));
            return authorities;
        });
        return converter;
    }

    private static SecretKey secretKey(JwtProperties props) {
        byte[] bytes = props.secret() == null ? new byte[0] : props.secret().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret phải dài tối thiểu 32 ký tự");
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }
}

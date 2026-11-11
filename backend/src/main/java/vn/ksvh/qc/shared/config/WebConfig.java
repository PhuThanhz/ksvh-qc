package vn.ksvh.qc.shared.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.format.datetime.standard.DateTimeFormatterRegistrar;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.Duration;
import java.util.List;

/**
 * Cấu hình Spring MVC dùng chung:
 * <ul>
 *   <li>Parse tham số ngày giờ trên query string theo chuẩn ISO-8601.</li>
 *   <li>Cấu hình CORS qua {@code app.web.cors.allowed-origins} (dùng chung cho MVC và Spring Security).</li>
 * </ul>
 */
@Configuration
@RequiredArgsConstructor
@EnableConfigurationProperties(WebProperties.class)
public class WebConfig implements WebMvcConfigurer {

    private static final List<String> ALLOWED_METHODS = List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
    private static final List<String> EXPOSED_HEADERS = List.of("X-Request-Id", "Content-Disposition");
    private static final long DEFAULT_MAX_AGE_SECONDS = 3600L;

    private final WebProperties props;

    @Override
    public void addFormatters(FormatterRegistry registry) {
        DateTimeFormatterRegistrar registrar = new DateTimeFormatterRegistrar();
        registrar.setUseIsoFormat(true);
        registrar.registerFormatters(registry);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> origins = allowedOrigins();
        if (origins.isEmpty()) {
            return;
        }
        registry.addMapping("/api/**")
                .allowedOrigins(origins.toArray(String[]::new))
                .allowedMethods(ALLOWED_METHODS.toArray(String[]::new))
                .allowedHeaders("*")
                .exposedHeaders(EXPOSED_HEADERS.toArray(String[]::new))
                .allowCredentials(true)
                .maxAge(maxAgeSeconds());
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        List<String> origins = allowedOrigins();
        if (origins.isEmpty()) {
            return source;
        }
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(ALLOWED_METHODS);
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(EXPOSED_HEADERS);
        config.setAllowCredentials(true);
        config.setMaxAge(maxAgeSeconds());
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    private List<String> allowedOrigins() {
        if (props.cors() == null || props.cors().allowedOrigins() == null) {
            return List.of();
        }
        return props.cors().allowedOrigins().stream()
                .filter(o -> o != null && !o.isBlank())
                .map(String::trim)
                .toList();
    }

    private long maxAgeSeconds() {
        Duration maxAge = props.cors() == null ? null : props.cors().maxAge();
        return maxAge == null ? DEFAULT_MAX_AGE_SECONDS : maxAge.toSeconds();
    }
}

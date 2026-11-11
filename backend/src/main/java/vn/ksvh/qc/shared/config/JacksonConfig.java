package vn.ksvh.qc.shared.config;

import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.core.StreamWriteFeature;
import tools.jackson.databind.DeserializationFeature;

import java.time.ZoneOffset;
import java.util.TimeZone;

/**
 * Chuẩn hoá serialize/deserialize JSON toàn hệ thống:
 * <ul>
 *   <li>Múi giờ UTC nhất quán với cột {@code TIMESTAMPTZ} và {@link ClockConfig}.</li>
 *   <li>{@code BigDecimal} xuất dạng số thập phân thuần (không dùng ký hiệu khoa học {@code 1E+2}).</li>
 *   <li>Bỏ qua field thừa từ client gửi lên để tương thích khi mở rộng DTO.</li>
 * </ul>
 */
@Configuration
public class JacksonConfig {

    @Bean
    JsonMapperBuilderCustomizer jsonMapperCustomizer() {
        return builder -> builder
                .defaultTimeZone(TimeZone.getTimeZone(ZoneOffset.UTC))
                .enable(StreamWriteFeature.WRITE_BIGDECIMAL_AS_PLAIN)
                .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
    }
}

package vn.ksvh.qc.shared.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/** Inject Clock thay vì gọi Instant.now() trực tiếp, để test điều khiển được thời gian. */
@Configuration
public class ClockConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}

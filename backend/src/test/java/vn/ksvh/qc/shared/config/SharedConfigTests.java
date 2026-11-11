package vn.ksvh.qc.shared.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class SharedConfigTests {

    @Autowired
    private JsonMapper jsonMapper;

    @Autowired
    private WebApplicationContext context;

    @Test
    void jsonMapperSerializesBigDecimalPlainAndInstantIsoUtc() {
        String json = jsonMapper.writeValueAsString(Map.of(
                "score", new BigDecimal("1E+2"),
                "at", Instant.parse("2026-11-11T01:30:00Z")));

        assertThat(json).contains("\"score\":100");
        assertThat(json).contains("\"at\":\"2026-11-11T01:30:00Z\"");
    }

    @Test
    void jsonMapperIgnoresUnknownPropertiesOnDeserialize() {
        SampleDto dto = jsonMapper.readValue("{\"name\":\"QC\",\"extraField\":123}", SampleDto.class);
        assertThat(dto.name()).isEqualTo("QC");
    }

    @Test
    void corsAllowsConfiguredDevOriginOnPreflight() throws Exception {
        MockMvc mvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        mvc.perform(options("/api/v1/auth/login")
                        .header(HttpHeaders.ORIGIN, "https://localhost:5273")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://localhost:5273"))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"));
    }

    private record SampleDto(String name) {
    }
}

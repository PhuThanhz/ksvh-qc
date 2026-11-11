package vn.ksvh.qc.shared.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Swagger UI tại /swagger-ui.html. OpenAPI JSON tại /v3/api-docs (frontend sinh type từ đây). */
@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI ksvhOpenApi() {
        return new OpenAPI()
                .info(new Info().title("KSVH QC API").version("v1"))
                .components(new Components().addSecuritySchemes("bearer",
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList("bearer"));
    }
}

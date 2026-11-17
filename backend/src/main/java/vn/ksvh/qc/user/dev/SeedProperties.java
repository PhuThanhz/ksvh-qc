package vn.ksvh.qc.user.dev;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Dữ liệu dev (chỉ profile dev), khai báo trong application-dev.yml → app.seed:
 * users = tài khoản thử; sampleData = có nạp db/dev-seed/sample_data.sql vào DB mới hay không.
 */
@ConfigurationProperties(prefix = "app.seed")
public record SeedProperties(List<SeedUser> users, boolean sampleData) {

    public record SeedUser(String username, String password, String fullName, List<String> roles) {
    }
}

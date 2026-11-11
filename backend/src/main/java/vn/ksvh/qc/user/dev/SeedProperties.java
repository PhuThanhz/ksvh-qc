package vn.ksvh.qc.user.dev;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/** Tài khoản dev tạo sẵn (chỉ profile dev), khai báo trong application-dev.yml → app.seed.users. */
@ConfigurationProperties(prefix = "app.seed")
public record SeedProperties(List<SeedUser> users) {

    public record SeedUser(String username, String password, String fullName, List<String> roles) {
    }
}

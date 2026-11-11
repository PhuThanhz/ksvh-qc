package vn.ksvh.qc.user.dev;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.security.permission.Permission;
import vn.ksvh.qc.user.domain.Role;
import vn.ksvh.qc.user.domain.RoleRepository;
import vn.ksvh.qc.user.domain.User;
import vn.ksvh.qc.user.domain.UserRepository;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Khởi tạo dữ liệu môi trường dev ({@code @Profile("dev")}):
 * <ul>
 *   <li>Kiểm tra đồng bộ giữa {@link Permission} trong code và bảng {@code role_permissions} (cảnh báo nếu thiếu).</li>
 *   <li>Tạo các tài khoản thử theo {@code app.seed.users} nếu chưa tồn tại.</li>
 * </ul>
 */
@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
@EnableConfigurationProperties(SeedProperties.class)
class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final SeedProperties props;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        verifyPermissionCatalog();
        seedUsers();
    }

    private void verifyPermissionCatalog() {
        Set<String> dbPermissions = roleRepository.findAll().stream()
                .flatMap(r -> r.getPermissions().stream())
                .collect(Collectors.toSet());
        Set<String> missingInDb = Arrays.stream(Permission.values())
                .map(Permission::code)
                .filter(code -> !dbPermissions.contains(code))
                .collect(Collectors.toSet());
        if (!missingInDb.isEmpty()) {
            log.warn("Có permission trong code chưa được gán cho role nào trong DB (kiểm tra Flyway migration): {}", missingInDb);
        }
    }

    private void seedUsers() {
        if (props.users() == null) {
            return;
        }
        props.users().stream()
                .filter(seed -> !userRepository.existsByUsername(seed.username()))
                .forEach(this::createUser);
    }

    private void createUser(SeedProperties.SeedUser seed) {
        User user = new User();
        user.setUsername(seed.username());
        user.setPasswordHash(passwordEncoder.encode(seed.password()));
        user.setFullName(seed.fullName());
        seed.roles().forEach(code -> {
            Role role = roleRepository.findByCode(code)
                    .orElseThrow(() -> new IllegalStateException("Thiếu role " + code));
            user.getRoles().add(role);
        });
        userRepository.save(user);
        log.info("Đã khởi tạo tài khoản dev '{}' với role {}", seed.username(), seed.roles());
    }
}

package vn.ksvh.qc.user.dev;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import vn.ksvh.qc.security.permission.Permission;
import vn.ksvh.qc.user.domain.Role;
import vn.ksvh.qc.user.domain.RoleRepository;
import vn.ksvh.qc.user.domain.User;
import vn.ksvh.qc.user.domain.UserRepository;

import javax.sql.DataSource;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Khởi tạo dữ liệu môi trường dev ({@code @Profile("dev")}):
 * <ul>
 *   <li>Kiểm tra đồng bộ giữa {@link Permission} trong code và bảng {@code role_permissions} (cảnh báo nếu thiếu).</li>
 *   <li>Tạo các tài khoản thử theo {@code app.seed.users} nếu chưa tồn tại.</li>
 *   <li>Nạp dữ liệu mẫu {@code db/dev-seed/sample_data.sql} khi bật {@code app.seed.sample-data} và chưa có công ty nào
 *       (DB mới). Chạy trong transaction riêng, sau khi tài khoản đã lưu; lỗi chỉ ghi cảnh báo.</li>
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
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;
    private final DataSource dataSource;
    private final TransactionTemplate tx;
    private final SeedProperties props;

    private static final String SAMPLE_DATA = "db/dev-seed/sample_data.sql";

    @Override
    public void run(ApplicationArguments args) {
        tx.executeWithoutResult(status -> {
            seedRoles();
            verifyPermissionCatalog();
            seedUsers();
        });
        if (props.sampleData()) {
            seedSampleData();
        }
    }

    /** Dữ liệu mẫu chỉ nạp vào DB mới (chưa có công ty) để không chồng lên dữ liệu người dùng đã nhập. */
    private void seedSampleData() {
        try {
            Integer companies = jdbc.queryForObject("SELECT COUNT(*) FROM companies", Integer.class);
            if (companies != null && companies > 0) {
                return;
            }
            tx.executeWithoutResult(status -> new ResourceDatabasePopulator(new ClassPathResource(SAMPLE_DATA)).execute(dataSource));
            log.info("Đã nạp dữ liệu mẫu dev từ {}", SAMPLE_DATA);
        } catch (Exception e) {
            log.warn("Không nạp được dữ liệu mẫu dev ({}): {}", SAMPLE_DATA, e.getMessage());
        }
    }

    private void seedRoles() {
        createRoleIfMissing("SYSTEM_ADMIN", "Quản trị hệ thống", "Ban Giải pháp: tạo tài khoản, phân quyền, cấu hình, theo dõi nhật ký",
                Arrays.stream(Permission.values()).map(Permission::code).collect(Collectors.toSet()));
        createRoleIfMissing("BUSINESS_ADMIN", "Quản trị nghiệp vụ", "Phòng KSVH: cập nhật tiêu chí, mẫu phiếu chấm, mức rủi ro",
                Set.of("organization:read", "criteria:read", "criteria:manage", "inspection:read:all", "report:read", "media:upload"));
        createRoleIfMissing("KSVH_LEAD", "Trưởng nhóm KSVH", "Phòng KSVH: lập kế hoạch kiểm tra, phân công Chuyên viên",
                Set.of("user:read", "organization:read", "criteria:read", "plan:read", "plan:create", "inspection:read:all", "report:read", "report:export"));
        createRoleIfMissing("KSVH_MANAGER", "Quản lý KSVH", "Phòng KSVH: duyệt phân công, xem xét khiếu nại, chủ trì họp thống nhất",
                Set.of("user:read", "organization:read", "criteria:read", "plan:read", "plan:approve", "inspection:read:all", "inspection:cancel", "finding:review-appeal", "finding:conclude-appeal", "report:read", "report:export"));
        createRoleIfMissing("KSVH_INSPECTOR", "Chuyên viên KSVH", "Phòng KSVH: chấm tiêu chí tại nhà hàng, nghiệm thu khắc phục",
                Set.of("organization:read", "criteria:read", "inspection:read:own", "inspection:perform", "finding:verify", "finding:review-appeal", "media:upload"));
        createRoleIfMissing("STORE_MANAGER", "Cửa hàng trưởng", "Nhà hàng: xác nhận hoặc khiếu nại lỗi; lập và thực hiện khắc phục",
                Set.of("inspection:read:own", "finding:respond", "finding:remediate", "media:upload"));
        createRoleIfMissing("OBM", "OBM", "Vận hành: tham gia xem xét khiếu nại",
                Set.of("inspection:read:own", "finding:review-appeal"));
        createRoleIfMissing("EXECUTIVE", "Ban Giám đốc", "Ban Giám đốc: xem kết quả kiểm tra, không chỉnh sửa dữ liệu",
                Set.of("organization:read", "criteria:read", "inspection:read:all", "report:read", "report:export"));
    }

    private void createRoleIfMissing(String code, String name, String desc, Set<String> permissions) {
        if (!roleRepository.existsByCodeIgnoreCase(code)) {
            Role role = new Role();
            role.setCode(code);
            role.setName(name);
            role.setDescription(desc);
            role.setSystemRole(true);
            role.setPermissions(new java.util.HashSet<>(permissions));
            roleRepository.save(role);
            log.info("Đã khởi tạo vai trò hệ thống '{}'", code);
        }
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

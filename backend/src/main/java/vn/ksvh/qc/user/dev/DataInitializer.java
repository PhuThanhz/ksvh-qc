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
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;
    private final SeedProperties props;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedRoles();
        verifyPermissionCatalog();
        seedUsers();
        seedBusinessData();
    }

    private void seedBusinessData() {
        try {
            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM inspection_items WHERE inspection_id = 2", Integer.class);
            if (count == null || count == 0) {
                jdbc.execute("""
                    INSERT INTO inspection_items (inspection_id, criterion_id, criterion_code, criterion_name, group_name, base_impact, result, sort_order, evaluated_at, comment) VALUES
                    (2, 1, 'TC-VS-01', 'Thực phẩm sống/chín phân tách độc lập, có tem nhãn date rõ ràng', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 3, 'PASS', 1, NOW() - INTERVAL 3 DAY, 'Tủ mát line lẩu sắp xếp gọn gàng'),
                    (2, 2, 'TC-VS-02', 'Nhiệt độ bảo quản tủ đông đạt chuẩn (-18°C đến -22°C)', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 3, 'PASS', 2, NOW() - INTERVAL 3 DAY, 'Nhiệt độ đo -19.5°C'),
                    (2, 3, 'TC-VS-03', 'Chất lượng dầu chiên đạt chuẩn, chỉ số phân cực TPM < 24%', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 2, 'PASS', 3, NOW() - INTERVAL 3 DAY, 'TPM 16.2% đạt chuẩn'),
                    (2, 4, 'TC-VS-04', 'Thớt và dao phân biệt màu sắc theo chủng loại thực phẩm', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 1, 'PASS', 4, NOW() - INTERVAL 3 DAY, 'Đầy đủ dao thớt chuyên dụng'),
                    (2, 5, 'TC-VC-01', 'Hệ thống hút mùi và bếp hoạt động ổn định, không khói mờ', 'Cơ sở vật chất & An toàn lao động', 2, 'PASS', 5, NOW() - INTERVAL 3 DAY, 'Hệ thống hút êm'),
                    (2, 6, 'TC-VC-02', 'Đèn diệt côn trùng và bẫy chuột hoạt động đúng vị trí quy định', 'Cơ sở vật chất & An toàn lao động', 2, 'PASS', 6, NOW() - INTERVAL 3 DAY, 'Đèn diệt côn trùng hoạt động tốt'),
                    (2, 7, 'TC-VC-03', 'Bình chữa cháy còn hạn kiểm định, đồng hồ áp suất kim chỉ vạch xanh', 'Cơ sở vật chất & An toàn lao động', 3, 'PASS', 7, NOW() - INTERVAL 3 DAY, 'Bình PCCC kiểm định đúng hạn'),
                    (2, 8, 'TC-QT-01', 'Nhân viên đeo khẩu trang, găng tay và đội mũ bảo hộ đúng quy cách', 'Quy trình phục vụ & Tác phong nhân viên', 2, 'PASS', 8, NOW() - INTERVAL 3 DAY, 'Nhân viên tuân thủ nghiêm túc'),
                    (2, 9, 'TC-QT-02', 'Sổ ghi chép nhiệt độ thiết bị và kiểm thực 3 bước ký đầy đủ ca', 'Quy trình phục vụ & Tác phong nhân viên', 1, 'PASS', 9, NOW() - INTERVAL 3 DAY, 'Ký đủ 3 ca'),

                    (3, 1, 'TC-VS-01', 'Thực phẩm sống/chín phân tách độc lập, có tem nhãn date rõ ràng', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 3, 'PASS', 1, NOW() - INTERVAL 2 DAY, 'Tem date đầy đủ'),
                    (3, 2, 'TC-VS-02', 'Nhiệt độ bảo quản tủ đông đạt chuẩn (-18°C đến -22°C)', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 3, 'FAIL', 2, NOW() - INTERVAL 2 DAY, 'Tủ rau củ 8°C lúc xả đá'),
                    (3, 3, 'TC-VS-03', 'Chất lượng dầu chiên đạt chuẩn, chỉ số phân cực TPM < 24%', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 2, 'PASS', 3, NOW() - INTERVAL 2 DAY, 'TPM 17% đạt chuẩn'),
                    (3, 4, 'TC-VS-04', 'Thớt và dao phân biệt màu sắc theo chủng loại thực phẩm', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 1, 'PASS', 4, NOW() - INTERVAL 2 DAY, 'Phân màu chuẩn'),
                    (3, 5, 'TC-VC-01', 'Hệ thống hút mùi và bếp hoạt động ổn định, không khói mờ', 'Cơ sở vật chất & An toàn lao động', 2, 'PASS', 5, NOW() - INTERVAL 2 DAY, 'Hút mùi tốt'),
                    (3, 6, 'TC-VC-02', 'Đèn diệt côn trùng và bẫy chuột hoạt động đúng vị trí quy định', 'Cơ sở vật chất & An toàn lao động', 2, 'PASS', 6, NOW() - INTERVAL 2 DAY, 'Đèn sáng tốt'),
                    (3, 7, 'TC-VC-03', 'Bình chữa cháy còn hạn kiểm định, đồng hồ áp suất kim chỉ vạch xanh', 'Cơ sở vật chất & An toàn lao động', 3, 'PASS', 7, NOW() - INTERVAL 2 DAY, 'PCCC đạt chuẩn'),
                    (3, 8, 'TC-QT-01', 'Nhân viên đeo khẩu trang, găng tay và đội mũ bảo hộ đúng quy cách', 'Quy trình phục vụ & Tác phong nhân viên', 2, 'PASS', 8, NOW() - INTERVAL 2 DAY, 'Đồng phục nghiêm túc'),
                    (3, 9, 'TC-QT-02', 'Sổ ghi chép nhiệt độ thiết bị và kiểm thực 3 bước ký đầy đủ ca', 'Quy trình phục vụ & Tác phong nhân viên', 1, 'PASS', 9, NOW() - INTERVAL 2 DAY, 'Ghi chép đều đặn'),

                    (4, 1, 'TC-VS-01', 'Thực phẩm sống/chín phân tách độc lập, có tem nhãn date rõ ràng', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 3, 'PASS', 1, NOW() - INTERVAL 1 DAY, 'Phân khu sống chín rõ ràng'),
                    (4, 2, 'TC-VS-02', 'Nhiệt độ bảo quản tủ đông đạt chuẩn (-18°C đến -22°C)', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 3, 'PASS', 2, NOW() - INTERVAL 1 DAY, 'Nhiệt độ -20°C'),
                    (4, 3, 'TC-VS-03', 'Chất lượng dầu chiên đạt chuẩn, chỉ số phân cực TPM < 24%', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 2, 'FAIL', 3, NOW() - INTERVAL 1 DAY, 'TPM 25.8% vượt ngưỡng'),
                    (4, 4, 'TC-VS-04', 'Thớt và dao phân biệt màu sắc theo chủng loại thực phẩm', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 1, 'PASS', 4, NOW() - INTERVAL 1 DAY, 'Đạt chuẩn'),
                    (4, 5, 'TC-VC-01', 'Hệ thống hút mùi và bếp hoạt động ổn định, không khói mờ', 'Cơ sở vật chất & An toàn lao động', 2, 'PASS', 5, NOW() - INTERVAL 1 DAY, 'Hút mùi tốt'),
                    (4, 6, 'TC-VC-02', 'Đèn diệt côn trùng và bẫy chuột hoạt động đúng vị trí quy định', 'Cơ sở vật chất & An toàn lao động', 2, 'PASS', 6, NOW() - INTERVAL 1 DAY, 'Bẫy côn trùng sạch'),
                    (4, 7, 'TC-VC-03', 'Bình chữa cháy còn hạn kiểm định, đồng hồ áp suất kim chỉ vạch xanh', 'Cơ sở vật chất & An toàn lao động', 3, 'PASS', 7, NOW() - INTERVAL 1 DAY, 'Đạt chuẩn'),
                    (4, 8, 'TC-QT-01', 'Nhân viên đeo khẩu trang, găng tay và đội mũ bảo hộ đúng quy cách', 'Quy trình phục vụ & Tác phong nhân viên', 2, 'PASS', 8, NOW() - INTERVAL 1 DAY, 'Trang phục chuẩn'),
                    (4, 9, 'TC-QT-02', 'Sổ ghi chép nhiệt độ thiết bị và kiểm thực 3 bước ký đầy đủ ca', 'Quy trình phục vụ & Tác phong nhân viên', 1, 'PASS', 9, NOW() - INTERVAL 1 DAY, 'Sổ ký đầy đủ')
                """);
                log.info("Đã khởi tạo dữ liệu tiêu chí chi tiết cho các đợt kiểm tra hoàn thành");
            }

            Integer occCount = jdbc.queryForObject("SELECT COUNT(*) FROM finding_occurrences", Integer.class);
            if (occCount == null || occCount == 0) {
                jdbc.execute("""
                    INSERT INTO finding_occurrences (restaurant_id, criterion_id, finding_id, source, occurred_at) VALUES
                    (3, 2, 1, 'CONFIRMED', NOW() - INTERVAL 5 DAY),
                    (3, 8, 2, 'CONFIRMED', NOW() - INTERVAL 5 DAY),
                    (4, 3, 3, 'CONFIRMED', NOW() - INTERVAL 1 DAY),
                    (3, 7, 7, 'CONFIRMED', '2026-10-15 10:00:00'),
                    (1, 1, 8, 'CONFIRMED', '2026-10-22 15:00:00'),
                    (4, 5, 9, 'CONFIRMED', '2026-09-18 10:00:00'),
                    (1, 9, 10, 'CONFIRMED', '2026-08-16 11:00:00')
                """);
                log.info("Đã khởi tạo lịch sử tần suất vi phạm (FindingOccurrences)");
            }

            Integer eventCount = jdbc.queryForObject("SELECT COUNT(*) FROM finding_events", Integer.class);
            if (eventCount == null || eventCount == 0) {
                jdbc.execute("""
                    INSERT INTO finding_events (finding_id, action, from_status, to_status, actor_id, note, created_at) VALUES
                    (1, 'CREATED', NULL, 'OPEN', 5, 'Phát hiện nhiệt độ tủ đông -14°C', NOW() - INTERVAL 5 DAY),
                    (2, 'CREATED', NULL, 'OPEN', 5, 'Phát hiện nhân viên chưa đội mũ bảo hộ', NOW() - INTERVAL 5 DAY),
                    (2, 'CONFIRMED', 'OPEN', 'CONFIRMED', 6, 'Cửa hàng xác nhận lỗi', NOW() - INTERVAL 4 DAY),
                    (2, 'REMEDIATION_PLANNED', 'CONFIRMED', 'REMEDIATING', 6, 'Đã nhắc nhở và trang bị thêm mũ bảo hộ', NOW() - INTERVAL 3 DAY),
                    (3, 'CREATED', NULL, 'OPEN', 5, 'Dầu chiên TPM 25.8%', NOW() - INTERVAL 1 DAY),
                    (3, 'CONFIRMED', 'OPEN', 'CONFIRMED', 6, 'Tiếp nhận lỗi thay dầu', NOW() - INTERVAL 1 DAY),
                    (4, 'CREATED', NULL, 'OPEN', 5, 'Tủ rau củ 8°C', NOW() - INTERVAL 2 DAY),
                    (4, 'APPEALED', 'OPEN', 'APPEALED', 6, 'Khiếu nại do đo lúc đang xả tuyết định kỳ', NOW() - INTERVAL 1 DAY),
                    (5, 'CREATED', NULL, 'OPEN', 5, 'Đèn diệt côn trùng hỏng bóng', NOW() - INTERVAL 3 DAY),
                    (5, 'REMEDIATION_SUBMITTED', 'REMEDIATING', 'PENDING_VERIFICATION', 6, 'Đã thay bóng đèn mới kèm ảnh', NOW() - INTERVAL 1 DAY)
                """);
                log.info("Đã khởi tạo nhật ký sự kiện xử lý lỗi (FindingEvents)");
            }
        } catch (Exception e) {
            log.warn("Không thể seed dữ liệu nghiệp vụ: {}", e.getMessage());
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

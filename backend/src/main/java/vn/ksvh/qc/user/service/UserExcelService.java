package vn.ksvh.qc.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.ksvh.qc.shared.excel.*;
import vn.ksvh.qc.shared.excel.ExcelImporter.Outcome;
import vn.ksvh.qc.user.domain.RoleRepository;
import vn.ksvh.qc.user.domain.User;
import vn.ksvh.qc.user.domain.UserRepository;
import vn.ksvh.qc.user.dto.UserCreateRequest;
import vn.ksvh.qc.user.dto.UserUpdateRequest;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Nhập / xuất Excel tài khoản người dùng. File xuất KHÔNG chứa mật khẩu;
 * cột "Mật khẩu ban đầu" chỉ dùng khi tạo tài khoản mới (tài khoản đã có bỏ qua cột này).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserExcelService {

    static final String USERNAME = "Tên đăng nhập", NAME = "Họ tên", ROLES = "Vai trò",
            PASSWORD = "Mật khẩu ban đầu", ACTIVE = "Hoạt động";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserService userService;
    private final ExcelImporter importer;

    private record Row(String username, String name, String roles, String password, Boolean active) {}

    private ExcelSheet<Row> sheet(List<Row> rows) {
        String roleList = roleRepository.findAll(Sort.by("code")).stream()
                .map(r -> r.getCode() + " (" + r.getName() + ")").collect(Collectors.joining(", "));
        return ExcelSheet.of("Người dùng", "DANH SÁCH TÀI KHOẢN NGƯỜI DÙNG", rows)
                .column(USERNAME, 20, Row::username).required()
                .note("3–50 ký tự: chữ không dấu, số, . - _. Không trùng (không phân biệt hoa thường).")
                .column(NAME, 30, Row::name).required()
                .column(ROLES, 34, Row::roles).required().note("Mã vai trò, nhiều vai trò cách nhau dấu phẩy. Có: " + roleList)
                .column(PASSWORD, 20, Row::password)
                .note("Chỉ dùng khi TẠO MỚI: 8–128 ký tự, có cả chữ và số. Tài khoản đã có: để trống. Xoá file sau khi nhập xong.")
                .column(ACTIVE, 12, Row::active).options("Có", "Không");
    }

    public byte[] export() {
        List<User> users = userRepository.findAll(Sort.by("username"));
        return ExcelWriter.export(List.of(sheet(users.stream().map(u -> new Row(u.getUsername(), u.getFullName(),
                String.join(", ", u.roleCodes().stream().sorted().toList()), null, u.isActive())).toList())));
    }

    public byte[] template() {
        return ExcelWriter.template(List.of(sheet(List.of())), List.of(
                "Mật khẩu ban đầu chỉ cần cho tài khoản mới; hãy yêu cầu người dùng đổi mật khẩu sau lần đăng nhập đầu.",
                "Vì file có mật khẩu, hãy xoá file (và thùng rác) ngay sau khi nhập xong, không gửi qua email / chat.",
                "Không tự khoá hoặc tự bỏ quyền quản lý người dùng của chính mình; luôn còn ít nhất một Quản trị hệ thống."));
    }

    @Transactional
    public ImportResult importFile(MultipartFile file, boolean commit, Long actorId) {
        try (ExcelImportFile excel = ExcelImportFile.open(file)) {
            List<ExcelRow> rows = excel.rows(sheet(List.of()), true);
            ExcelImporter.Session session = importer.start(commit);
            session.rows(rows, row -> {
                String username = row.text(USERNAME);
                Optional<User> existing = username == null ? Optional.empty()
                        : userRepository.findByUsername(username.trim().toLowerCase(Locale.ROOT));
                Set<String> roles = row.list(ROLES).stream().map(s -> s.toUpperCase(Locale.ROOT)).collect(Collectors.toCollection(LinkedHashSet::new));
                List<String> unknown = roles.stream().filter(code -> roleRepository.findByCode(code).isEmpty()).toList();
                if (!unknown.isEmpty()) {
                    throw new ExcelCellException(ROLES, "Không có vai trò: " + String.join(", ", unknown));
                }
                if (existing.isPresent()) {
                    UserUpdateRequest req = session.validate(new UserUpdateRequest(row.text(NAME), roles, row.bool(ACTIVE, true)),
                            row, Map.of("fullName", NAME, "roles", ROLES));
                    userService.update(existing.get().getId(), req, actorId);
                    return Outcome.UPDATED;
                }
                UserCreateRequest req = session.validate(new UserCreateRequest(username, row.text(NAME), row.text(PASSWORD),
                        roles, row.bool(ACTIVE, true)), row, Map.of("username", USERNAME, "fullName", NAME,
                        "password", PASSWORD, "roles", ROLES));
                userService.create(req, actorId);
                return Outcome.CREATED;
            });
            return session.finish();
        }
    }
}

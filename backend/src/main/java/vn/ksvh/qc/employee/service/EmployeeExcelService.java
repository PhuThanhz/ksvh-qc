package vn.ksvh.qc.employee.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.ksvh.qc.employee.domain.Employee;
import vn.ksvh.qc.employee.domain.EmployeeRepository;
import vn.ksvh.qc.employee.dto.EmployeeRequest;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.shared.excel.*;
import vn.ksvh.qc.shared.excel.ExcelImporter.Outcome;
import vn.ksvh.qc.user.api.UserAccount;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/** Nhập / xuất Excel hồ sơ nhân viên. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeExcelService {

    static final String CODE = "Mã nhân viên", NAME = "Họ tên", TITLE = "Chức danh", UNIT = "Mã đơn vị",
            PHONE = "Điện thoại", EMAIL = "Email", ACCOUNT = "Tài khoản đăng nhập", ACTIVE = "Hoạt động";

    private final EmployeeRepository employeeRepository;
    private final EmployeeService employeeService;
    private final OrgUnitLookupApi orgUnits;
    private final UserAccountApi users;
    private final ExcelImporter importer;

    private record Row(String code, String name, String title, String unit, String phone, String email,
                       String account, Boolean active) {}

    private static ExcelSheet<Row> sheet(List<Row> rows) {
        return ExcelSheet.of("Nhân viên", "DANH SÁCH NHÂN VIÊN", rows)
                .column(CODE, 16, Row::code).required().note("Chữ không dấu, số, - hoặc _. Không trùng.")
                .column(NAME, 30, Row::name).required()
                .column(TITLE, 24, Row::title)
                .column(UNIT, 16, Row::unit).note("Mã nhà hàng / phòng ban đang hoạt động.")
                .column(PHONE, 16, Row::phone)
                .column(EMAIL, 28, Row::email)
                .column(ACCOUNT, 20, Row::account).note("Tên đăng nhập liên kết (mỗi tài khoản chỉ gắn một nhân viên).")
                .column(ACTIVE, 12, Row::active).options("Có", "Không");
    }

    public byte[] export() {
        List<Employee> list = employeeRepository.findAll(Sort.by("employeeCode"));
        Map<Long, OrgUnitRef> unitMap = orgUnits.findRefs(list.stream().map(Employee::getOrgUnitId).filter(Objects::nonNull).toList());
        Map<Long, UserSummary> userMap = users.findSummaries(list.stream().map(Employee::getUserId).filter(Objects::nonNull).toList());
        return ExcelWriter.export(List.of(sheet(list.stream().map(e -> new Row(e.getEmployeeCode(), e.getFullName(),
                e.getJobTitle(),
                e.getOrgUnitId() == null || unitMap.get(e.getOrgUnitId()) == null ? null : unitMap.get(e.getOrgUnitId()).code(),
                e.getPhone(), e.getEmail(),
                e.getUserId() == null || userMap.get(e.getUserId()) == null ? null : userMap.get(e.getUserId()).username(),
                e.isActive())).toList())));
    }

    public byte[] template() {
        return ExcelWriter.template(List.of(sheet(List.of())), List.of(
                "Mã đơn vị trỏ tới nhà hàng / phòng ban đã khai báo ở danh mục Tổ chức.",
                "Tài khoản đăng nhập là tuỳ chọn; tạo tài khoản trước ở danh mục Người dùng nếu cần liên kết."));
    }

    @Transactional
    public ImportResult importFile(MultipartFile file, boolean commit, Long actorId) {
        try (ExcelImportFile excel = ExcelImportFile.open(file)) {
            List<ExcelRow> rows = excel.rows(sheet(List.of()), true);
            ExcelImporter.Session session = importer.start(commit);
            Map<String, String> fields = Map.of("employeeCode", CODE, "fullName", NAME, "jobTitle", TITLE,
                    "orgUnitId", UNIT, "phone", PHONE, "email", EMAIL, "userId", ACCOUNT);
            session.rows(rows, row -> {
                String code = row.text(CODE);
                Optional<Employee> existing = code == null ? Optional.empty() : employeeRepository.findByEmployeeCodeIgnoreCase(code);
                String unitCode = row.text(UNIT);
                Long unitId = unitCode == null ? null : orgUnits.findByCode(unitCode).map(OrgUnitRef::id)
                        .orElseThrow(() -> new ExcelCellException(UNIT, "Không tìm thấy đơn vị có mã \"%s\"".formatted(unitCode)));
                String account = row.text(ACCOUNT);
                Long userId = account == null ? null : users.findByUsername(account.trim()).map(UserAccount::id)
                        .orElseThrow(() -> new ExcelCellException(ACCOUNT, "Không tìm thấy tài khoản \"%s\"".formatted(account)));
                EmployeeRequest req = session.validate(new EmployeeRequest(code, row.text(NAME), row.text(TITLE), unitId,
                        row.text(PHONE), row.text(EMAIL), userId, row.bool(ACTIVE, true)), row, fields);
                if (existing.isPresent()) {
                    employeeService.update(existing.get().getId(), req, actorId);
                    return Outcome.UPDATED;
                }
                employeeService.create(req, actorId);
                return Outcome.CREATED;
            });
            return session.finish();
        }
    }
}

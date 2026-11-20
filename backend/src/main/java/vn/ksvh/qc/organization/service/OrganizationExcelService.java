package vn.ksvh.qc.organization.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.ksvh.qc.organization.domain.*;
import vn.ksvh.qc.organization.dto.CompanyRequest;
import vn.ksvh.qc.organization.dto.OrgUnitRequest;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.excel.*;
import vn.ksvh.qc.shared.excel.ExcelImporter.Outcome;
import vn.ksvh.qc.user.api.UserAccount;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.util.*;
import java.util.stream.Stream;

/** Nhập / xuất Excel danh mục 1–2: công ty, nhà hàng / phòng ban. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrganizationExcelService {

    static final String CO_CODE = "Mã công ty", CO_NAME = "Tên công ty", ACTIVE = "Hoạt động";
    static final String U_CODE = "Mã đơn vị", U_NAME = "Tên đơn vị", U_COMPANY = "Mã công ty", U_TYPE = "Loại đơn vị",
            U_ADDRESS = "Địa chỉ", U_CHT = "Tài khoản CHT", U_OBM = "Tài khoản OBM",
            U_LAT = "Vĩ độ", U_LNG = "Kinh độ", U_RADIUS = "Bán kính GPS (m)",
            U_THRESHOLD = "Ngưỡng nâng mức riêng", U_RESET = "Hạ mức sau (tháng) riêng",
            U_STEP = "Số bậc nâng riêng";
    private static final Map<String, OrgUnitType> TYPES = new LinkedHashMap<>();
    static {
        TYPES.put("Nhà hàng", OrgUnitType.RESTAURANT);
        TYPES.put("Phòng ban", OrgUnitType.DEPARTMENT);
    }
    private static final List<String> YES_NO = List.of("Có", "Không");

    private final CompanyRepository companyRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final CompanyService companyService;
    private final OrgUnitService orgUnitService;
    private final UserAccountApi userAccountApi;
    private final ExcelImporter importer;

    private record CompanyRow(String code, String name, Boolean active) {}

    private record UnitRow(String code, String name, String companyCode, String type, String address,
                           String cht, String obm, Double lat, Double lng, Integer radius, Integer threshold, Integer reset, Integer step, Boolean active) {}

    private static ExcelSheet<CompanyRow> companySheet(List<CompanyRow> rows) {
        return ExcelSheet.of("Công ty", "DANH MỤC CÔNG TY", rows)
                .column(CO_CODE, 16, CompanyRow::code).required().note("Chữ không dấu, số, - hoặc _. Không trùng.")
                .column(CO_NAME, 45, CompanyRow::name).required()
                .column(ACTIVE, 12, CompanyRow::active).options(YES_NO);
    }

    private static ExcelSheet<UnitRow> unitSheet(List<UnitRow> rows) {
        return ExcelSheet.of("Nhà hàng - Phòng ban", "DANH MỤC NHÀ HÀNG / PHÒNG BAN", rows)
                .column(U_CODE, 16, UnitRow::code).required().note("Chữ không dấu, số, - hoặc _. Không trùng.")
                .column(U_NAME, 36, UnitRow::name).required()
                .column(U_COMPANY, 14, UnitRow::companyCode).required().note("Mã công ty ở sheet Công ty hoặc đã có trong hệ thống.")
                .column(U_TYPE, 14, UnitRow::type).required().options(List.copyOf(TYPES.keySet()))
                .column(U_ADDRESS, 40, UnitRow::address).wrap()
                .column(U_CHT, 16, UnitRow::cht).note("Tên đăng nhập của Cửa hàng trưởng (vai trò STORE_MANAGER).")
                .column(U_OBM, 16, UnitRow::obm).note("Tên đăng nhập của OBM phụ trách.")
                .column(U_LAT, 13, UnitRow::lat).note("Không bắt buộc. Số thập phân, vd 10.762622. Nhập thì phải có cả kinh độ.")
                .column(U_LNG, 13, UnitRow::lng).note("Không bắt buộc. Số thập phân, vd 106.660172")
                .column(U_RADIUS, 14, UnitRow::radius).note("Không bắt buộc. Từ 10 đến 5000 mét.")
                .column(U_THRESHOLD, 16, UnitRow::threshold)
                .note("Chỉ cho nhà hàng cần khác quy tắc chung (vd fine dining). Từ 2 đến 50 lần. Bỏ trống = theo quy tắc chung.")
                .column(U_RESET, 16, UnitRow::reset)
                .note("Số tháng liên tục không lỗi để hạ về mức gốc, 1–24. Bỏ trống = theo quy tắc chung.")
                .column(U_STEP, 14, UnitRow::step)
                .note("Số bậc nâng mức ảnh hưởng khi chạm ngưỡng, 1–4. Bỏ trống = theo quy tắc chung.")
                .column(ACTIVE, 12, UnitRow::active).options(YES_NO);
    }

    public byte[] export() {
        List<Company> companies = companyRepository.findAll(Sort.by("code"));
        Map<Long, String> companyCodes = new HashMap<>();
        companies.forEach(c -> companyCodes.put(c.getId(), c.getCode()));
        List<OrgUnit> units = orgUnitRepository.findAll(Sort.by("code"));
        Map<Long, UserSummary> users = userAccountApi.findSummaries(units.stream()
                .flatMap(u -> Stream.of(u.getStoreManagerUserId(), u.getObmUserId()))
                .filter(Objects::nonNull).distinct().toList());
        List<UnitRow> unitRows = units.stream().map(u -> new UnitRow(u.getCode(), u.getName(),
                u.getCompany() != null ? companyCodes.get(u.getCompany().getId()) : null,
                u.getUnitType() == OrgUnitType.RESTAURANT ? "Nhà hàng" : "Phòng ban",
                u.getAddress(), username(users, u.getStoreManagerUserId()), username(users, u.getObmUserId()),
                u.getLatitude(), u.getLongitude(), u.getCheckinRadiusM(),
                u.getEscalationThreshold() == null ? null : u.getEscalationThreshold().intValue(),
                u.getEscalationResetMonths() == null ? null : u.getEscalationResetMonths().intValue(),
                u.getEscalationStep() == null ? null : u.getEscalationStep().intValue(), u.isActive())).toList();
        return ExcelWriter.export(List.of(
                companySheet(companies.stream().map(c -> new CompanyRow(c.getCode(), c.getName(), c.isActive())).toList()),
                unitSheet(unitRows)));
    }

    public byte[] template() {
        return ExcelWriter.template(List.of(companySheet(List.of()), unitSheet(List.of())), List.of(
                "Nhập công ty ở sheet \"Công ty\" trước; sheet \"Nhà hàng - Phòng ban\" trỏ tới công ty qua cột Mã công ty.",
                "Toạ độ GPS và bán kính chưa bắt buộc; nếu nhập, hệ thống ghi khoảng cách khi Chuyên viên bắt đầu kiểm tra. Lấy toạ độ: Google Maps → nhấn giữ vị trí → sao chép số.",
                "Tài khoản CHT / OBM: nhập tên đăng nhập đã có trong hệ thống (tạo tài khoản trước ở danh mục Người dùng)."));
    }

    @Transactional
    public ImportResult importFile(MultipartFile file, boolean commit) {
        try (ExcelImportFile excel = ExcelImportFile.open(file)) {
            List<ExcelRow> companyRows = excel.rows(companySheet(List.of()), false);
            List<ExcelRow> unitRows = excel.rows(unitSheet(List.of()), false);
            if (companyRows.isEmpty() && unitRows.isEmpty()) {
                throw new BusinessException(ErrorCode.EXCEL_INVALID_FILE,
                        "File không có dòng dữ liệu nào ở sheet \"Công ty\" hoặc \"Nhà hàng - Phòng ban\"");
            }
            ExcelImporter.Session session = importer.start(commit);
            session.rows(companyRows, row -> {
                String code = row.text(CO_CODE);
                Optional<Company> existing = code == null ? Optional.empty() : companyRepository.findByCodeIgnoreCase(code);
                CompanyRequest req = session.validate(new CompanyRequest(code, row.text(CO_NAME), row.bool(ACTIVE, true)),
                        row, Map.of("code", CO_CODE, "name", CO_NAME));
                if (existing.isPresent()) {
                    companyService.update(existing.get().getId(), req);
                    return Outcome.UPDATED;
                }
                companyService.create(req);
                return Outcome.CREATED;
            });

            Map<String, String> unitFields = Map.ofEntries(Map.entry("companyId", U_COMPANY), Map.entry("unitType", U_TYPE),
                    Map.entry("code", U_CODE), Map.entry("name", U_NAME), Map.entry("address", U_ADDRESS),
                    Map.entry("latitude", U_LAT), Map.entry("longitude", U_LNG), Map.entry("checkinRadiusM", U_RADIUS),
                    Map.entry("escalationThreshold", U_THRESHOLD), Map.entry("escalationResetMonths", U_RESET),
                    Map.entry("escalationStep", U_STEP));
            session.rows(unitRows, row -> {
                String code = row.text(U_CODE);
                Optional<OrgUnit> existing = code == null ? Optional.empty() : orgUnitRepository.findByCodeIgnoreCase(code);
                String companyCode = row.text(U_COMPANY);
                Long companyId = companyCode == null ? null : companyRepository.findByCodeIgnoreCase(companyCode).map(Company::getId)
                        .orElseThrow(() -> new ExcelCellException(U_COMPANY, "Không tìm thấy công ty có mã \"%s\"".formatted(companyCode)));
                OrgUnitRequest req = session.validate(new OrgUnitRequest(companyId, row.choice(U_TYPE, TYPES), code,
                        row.text(U_NAME), row.text(U_ADDRESS),
                        row.number(U_LAT), row.number(U_LNG), row.integer(U_RADIUS), row.bool(ACTIVE, true),
                        row.integer(U_THRESHOLD), row.integer(U_RESET), row.integer(U_STEP)), row, unitFields);
                Long chtId = userId(row, U_CHT);
                Long obmId = userId(row, U_OBM);
                Long unitId = existing.isPresent()
                        ? orgUnitService.update(existing.get().getId(), req).id()
                        : orgUnitService.create(req).id();
                orgUnitService.setAssignees(unitId, chtId, obmId);
                return existing.isPresent() ? Outcome.UPDATED : Outcome.CREATED;
            });
            return session.finish();
        }
    }

    private Long userId(ExcelRow row, String column) {
        String username = row.text(column);
        if (username == null) {
            return null;
        }
        return userAccountApi.findByUsername(username.trim()).map(UserAccount::id)
                .orElseThrow(() -> new ExcelCellException(column, "Không tìm thấy tài khoản \"%s\"".formatted(username)));
    }

    private static String username(Map<Long, UserSummary> users, Long id) {
        UserSummary u = id == null ? null : users.get(id);
        return u == null ? null : u.username();
    }
}

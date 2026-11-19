package vn.ksvh.qc.criteria.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.ksvh.qc.criteria.domain.*;
import vn.ksvh.qc.criteria.dto.CriterionGroupRequest;
import vn.ksvh.qc.criteria.dto.CriterionRequest;
import vn.ksvh.qc.criteria.dto.RiskLevelItem;
import vn.ksvh.qc.criteria.dto.RiskLevelVersionRequest;
import vn.ksvh.qc.criteria.dto.TemplateRequest;
import vn.ksvh.qc.organization.api.CompanyLookupApi;
import vn.ksvh.qc.organization.api.CompanyRef;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.excel.*;
import vn.ksvh.qc.shared.excel.ExcelImporter.Outcome;
import vn.ksvh.qc.shared.util.BusinessDates;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/** Nhập / xuất Excel danh mục 5 (nhóm tiêu chí, tiêu chí), 6 (mẫu phiếu) và 7 (phân loại rủi ro). */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CriteriaExcelService {

    // Tên cột dùng chung giữa file xuất, file mẫu và khi đọc file nhập.
    static final String G_CODE = "Mã nhóm", G_NAME = "Tên nhóm", G_ORDER = "Thứ tự", G_COMPANY = "Mã công ty", ACTIVE = "Hoạt động";
    static final String C_CODE = "Mã tiêu chí", C_NAME = "Tên tiêu chí", C_GROUP = "Mã nhóm", C_IMPACT = "Mức ảnh hưởng",
            C_METHOD = "Cách kiểm tra", C_EVIDENCE = "Bằng chứng yêu cầu", C_ORDER = "Thứ tự";
    static final String T_CODE = "Mã mẫu phiếu", T_NAME = "Tên mẫu phiếu", T_COMPANY = "Mã công ty",
            T_TYPE = "Loại kiểm tra", T_DESC = "Mô tả";
    static final String I_TEMPLATE = "Mã mẫu phiếu", I_CRITERION = "Mã tiêu chí", I_ORDER = "Thứ tự";
    static final String R_CODE = "Mã mức", R_NAME = "Tên mức", R_MAX = "Điểm trần (<)",
            R_DAYS = "Hạn khắc phục (ngày)", R_ACTION = "Hành động bắt buộc", R_EFFECTIVE = "Ngày hiệu lực";
    private static final List<String> YES_NO = List.of("Có", "Không");

    private final CriterionGroupRepository groupRepository;
    private final CriterionRepository criterionRepository;
    private final InspectionTemplateRepository templateRepository;
    private final RiskLevelRepository riskLevelRepository;
    private final RiskConfigService riskConfigService;
    private final CriterionService criterionService;
    private final TemplateService templateService;
    private final CompanyLookupApi companyLookupApi;
    private final ExcelImporter importer;
    private final Clock clock;

    // ---------- Nhóm tiêu chí & tiêu chí ----------

    private record GroupRow(String code, String name, Integer sortOrder, String companyCode, Boolean active) {}

    private record CriterionRow(String code, String name, String groupCode, Integer impact, String method,
                                String evidence, Integer sortOrder, Boolean active) {}

    private static ExcelSheet<GroupRow> groupSheet(List<GroupRow> rows) {
        return ExcelSheet.of("Nhóm tiêu chí", "DANH MỤC NHÓM TIÊU CHÍ", rows)
                .column(G_CODE, 16, GroupRow::code).required().note("Chữ không dấu, số, - hoặc _. Không trùng.")
                .column(G_NAME, 40, GroupRow::name).required()
                .column(G_ORDER, 10, GroupRow::sortOrder).note("Số nguyên ≥ 0, nhỏ đứng trước. Để trống = 0.")
                .column(G_COMPANY, 16, GroupRow::companyCode).note("Để trống = nhóm dùng chung mọi công ty.")
                .column(ACTIVE, 12, GroupRow::active).options(YES_NO);
    }

    private static ExcelSheet<CriterionRow> criterionSheet(List<CriterionRow> rows) {
        return ExcelSheet.of("Tiêu chí", "DANH MỤC TIÊU CHÍ KIỂM TRA", rows)
                .column(C_CODE, 16, CriterionRow::code).required().note("Chữ không dấu, số, . - hoặc _. Không trùng.")
                .column(C_NAME, 45, CriterionRow::name).required().wrap()
                .column(C_GROUP, 14, CriterionRow::groupCode).required().note("Mã nhóm ở sheet Nhóm tiêu chí hoặc đã có trong hệ thống.")
                .column(C_IMPACT, 14, CriterionRow::impact).required().options("1", "2", "3", "4", "5")
                .note("Mức ảnh hưởng gốc: 1 rất nhẹ … 5 rất nghiêm trọng.")
                .column(C_METHOD, 45, CriterionRow::method).wrap()
                .column(C_EVIDENCE, 35, CriterionRow::evidence).wrap()
                .column(C_ORDER, 10, CriterionRow::sortOrder).note("Thứ tự trong nhóm. Để trống = 0.")
                .column(ACTIVE, 12, CriterionRow::active).options(YES_NO);
    }

    public byte[] exportCriteria() {
        List<CriterionGroup> groups = groupRepository.findAllByOrderBySortOrderAscIdAsc();
        Map<Long, CompanyRef> companies = companyLookupApi.findRefs(groups.stream().map(CriterionGroup::getCompanyId).toList());
        List<GroupRow> groupRows = groups.stream().map(g -> new GroupRow(g.getCode(), g.getName(), g.getSortOrder(),
                companyCode(companies, g.getCompanyId()), g.isActive())).toList();

        Map<Long, Integer> groupOrder = new HashMap<>();
        for (int i = 0; i < groups.size(); i++) {
            groupOrder.put(groups.get(i).getId(), i);
        }
        List<CriterionRow> criterionRows = criterionRepository.findAllByOrderByCodeAsc().stream()
                .sorted(Comparator.comparing((Criterion c) -> groupOrder.getOrDefault(c.getGroup().getId(), Integer.MAX_VALUE))
                        .thenComparingInt(Criterion::getSortOrder).thenComparing(Criterion::getCode))
                .map(c -> new CriterionRow(c.getCode(), c.getName(), c.getGroup().getCode(), (int) c.getBaseImpact(),
                        c.getCheckMethod(), c.getEvidenceRequired(), c.getSortOrder(), c.isActive()))
                .toList();
        return ExcelWriter.export(List.of(groupSheet(groupRows), criterionSheet(criterionRows)));
    }

    public byte[] criteriaTemplate() {
        return ExcelWriter.template(List.of(groupSheet(List.of()), criterionSheet(List.of())), List.of(
                "Nhập nhóm ở sheet \"Nhóm tiêu chí\" trước, sau đó nhập tiêu chí ở sheet \"Tiêu chí\" (cột Mã nhóm trỏ tới nhóm).",
                "Có thể chỉ nhập sheet Tiêu chí nếu các nhóm đã có sẵn trong hệ thống.",
                "Mẹo: dùng nút Xuất Excel để lấy dữ liệu hiện có, sửa trực tiếp rồi nhập lại."));
    }

    @Transactional
    public ImportResult importCriteria(MultipartFile file, boolean commit, Long actorId) {
        try (ExcelImportFile excel = ExcelImportFile.open(file)) {
            List<ExcelRow> groupRows = excel.rows(groupSheet(List.of()), false);
            List<ExcelRow> criterionRows = excel.rows(criterionSheet(List.of()), false);
            if (groupRows.isEmpty() && criterionRows.isEmpty()) {
                throw new BusinessException(ErrorCode.EXCEL_INVALID_FILE,
                        "File không có dòng dữ liệu nào ở sheet \"Nhóm tiêu chí\" hoặc \"Tiêu chí\"");
            }
            ExcelImporter.Session session = importer.start(commit);
            Map<String, String> groupFields = Map.of("code", G_CODE, "name", G_NAME, "sortOrder", G_ORDER, "companyId", G_COMPANY);
            session.rows(groupRows, row -> {
                String code = row.text(G_CODE);
                Optional<CriterionGroup> existing = code == null ? Optional.empty() : groupRepository.findByCodeIgnoreCase(code);
                Long companyId = companyId(row.text(G_COMPANY), G_COMPANY);
                Integer order = row.integer(G_ORDER);
                CriterionGroupRequest req = session.validate(new CriterionGroupRequest(code, row.text(G_NAME),
                        order != null ? order : existing.map(CriterionGroup::getSortOrder).orElse(0),
                        companyId, row.bool(ACTIVE, true)), row, groupFields);
                if (existing.isPresent()) {
                    criterionService.updateGroup(existing.get().getId(), req, actorId);
                    return Outcome.UPDATED;
                }
                criterionService.createGroup(req, actorId);
                return Outcome.CREATED;
            });

            Map<String, String> criterionFields = Map.of("groupId", C_GROUP, "code", C_CODE, "name", C_NAME,
                    "checkMethod", C_METHOD, "evidenceRequired", C_EVIDENCE, "baseImpact", C_IMPACT, "sortOrder", C_ORDER);
            session.rows(criterionRows, row -> {
                String code = row.text(C_CODE);
                Optional<Criterion> existing = code == null ? Optional.empty() : criterionRepository.findByCodeIgnoreCase(code);
                String groupCode = row.text(C_GROUP);
                Long groupId = groupCode == null ? null : groupRepository.findByCodeIgnoreCase(groupCode)
                        .map(CriterionGroup::getId)
                        .orElseThrow(() -> new ExcelCellException(C_GROUP, "Không tìm thấy nhóm có mã \"%s\"".formatted(groupCode)));
                Integer order = row.integer(C_ORDER);
                CriterionRequest req = session.validate(new CriterionRequest(groupId, code, row.text(C_NAME),
                        row.text(C_METHOD), row.text(C_EVIDENCE), row.integer(C_IMPACT),
                        order != null ? order : existing.map(Criterion::getSortOrder).orElse(0),
                        row.bool(ACTIVE, true), null), row, criterionFields);
                if (existing.isPresent()) {
                    criterionService.update(existing.get().getId(), req, actorId);
                    return Outcome.UPDATED;
                }
                criterionService.create(req, actorId);
                return Outcome.CREATED;
            });
            return session.finish();
        }
    }

    // ---------- Mẫu phiếu ----------

    private record TemplateRow(String code, String name, String companyCode,
                               String inspectionType, String description, Boolean active) {}

    private record TemplateItemRow(String templateCode, String criterionCode, Integer order) {}

    private static ExcelSheet<TemplateRow> templateSheet(List<TemplateRow> rows) {
        return ExcelSheet.of("Mẫu phiếu", "DANH MỤC MẪU PHIẾU CHẤM", rows)
                .column(T_CODE, 16, TemplateRow::code).required().note("Chữ không dấu, số, - hoặc _. Không trùng.")
                .column(T_NAME, 40, TemplateRow::name).required()
                .column(T_COMPANY, 16, TemplateRow::companyCode).note("Để trống = mẫu dùng chung mọi công ty.")
                .column(T_TYPE, 18, TemplateRow::inspectionType).note("Ví dụ: Định kỳ, Đột xuất.")
                .column(T_DESC, 40, TemplateRow::description).wrap()
                .column(ACTIVE, 12, TemplateRow::active).options(YES_NO);
    }

    private static ExcelSheet<TemplateItemRow> templateItemSheet(List<TemplateItemRow> rows) {
        return ExcelSheet.of("Tiêu chí trong mẫu", "TIÊU CHÍ THUỘC TỪNG MẪU PHIẾU", rows)
                .column(I_TEMPLATE, 16, TemplateItemRow::templateCode).required().note("Mã mẫu ở sheet Mẫu phiếu.")
                .column(I_CRITERION, 16, TemplateItemRow::criterionCode).required().note("Mã tiêu chí đã có trong hệ thống.")
                .column(I_ORDER, 10, TemplateItemRow::order).note("Thứ tự hiển thị khi chấm. Để trống = theo thứ tự dòng.");
    }

    public byte[] exportTemplates() {
        List<InspectionTemplate> templates = templateRepository.findAll(Sort.by("code"));
        Map<Long, CompanyRef> companies = companyLookupApi.findRefs(templates.stream().map(InspectionTemplate::getCompanyId).toList());
        Map<Long, String> criterionCodes = criterionRepository.findByIdIn(templates.stream()
                        .flatMap(t -> t.getItems().stream().map(TemplateItem::getCriterionId)).distinct().toList())
                .stream().collect(Collectors.toMap(Criterion::getId, Criterion::getCode));
        List<TemplateRow> rows = templates.stream().map(t -> new TemplateRow(t.getCode(), t.getName(),
                companyCode(companies, t.getCompanyId()),
                t.getInspectionType(), t.getDescription(), t.isActive())).toList();
        List<TemplateItemRow> items = templates.stream().flatMap(t -> t.getItems().stream()
                .map(i -> new TemplateItemRow(t.getCode(), criterionCodes.get(i.getCriterionId()), i.getSortOrder()))).toList();
        return ExcelWriter.export(List.of(templateSheet(rows), templateItemSheet(items)));
    }

    public byte[] templatesTemplate() {
        return ExcelWriter.template(List.of(templateSheet(List.of()), templateItemSheet(List.of())), List.of(
                "Khai báo mẫu ở sheet \"Mẫu phiếu\", danh sách tiêu chí của mẫu ở sheet \"Tiêu chí trong mẫu\" (mỗi tiêu chí một dòng).",
                "Mẫu đã có: nếu sheet \"Tiêu chí trong mẫu\" có dòng của mẫu đó thì THAY TOÀN BỘ danh sách tiêu chí; không có dòng nào thì giữ nguyên.",
                "Tiêu chí thuộc nhóm riêng của một công ty chỉ đưa được vào mẫu của đúng công ty đó."));
    }

    @Transactional
    public ImportResult importTemplates(MultipartFile file, boolean commit, Long actorId) {
        try (ExcelImportFile excel = ExcelImportFile.open(file)) {
            List<ExcelRow> templateRows = excel.rows(templateSheet(List.of()), true);
            List<ExcelRow> itemRows = excel.rows(templateItemSheet(List.of()), false);
            ExcelImporter.Session session = importer.start(commit);

            Set<String> templateCodes = new HashSet<>();
            for (ExcelRow r : templateRows) {
                String c = r.text(T_CODE);
                if (c != null) {
                    templateCodes.add(c.toLowerCase(Locale.ROOT));
                }
            }
            // Gom tiêu chí theo mẫu, giữ thứ tự (cột Thứ tự, rồi thứ tự dòng).
            record Item(long criterionId, int order, int line) {}
            Map<String, List<Item>> itemsByTemplate = new HashMap<>();
            for (ExcelRow r : itemRows) {
                try {
                    String tCode = r.text(I_TEMPLATE);
                    String cCode = r.text(I_CRITERION);
                    if (tCode == null || cCode == null) {
                        session.error(r, tCode == null ? I_TEMPLATE : I_CRITERION, "Bắt buộc nhập");
                        continue;
                    }
                    if (!templateCodes.contains(tCode.toLowerCase(Locale.ROOT))) {
                        session.error(r, I_TEMPLATE, "Mã mẫu \"%s\" không có trong sheet Mẫu phiếu".formatted(tCode));
                        continue;
                    }
                    Optional<Criterion> crit = criterionRepository.findByCodeIgnoreCase(cCode);
                    if (crit.isEmpty()) {
                        session.error(r, I_CRITERION, "Không tìm thấy tiêu chí có mã \"%s\"".formatted(cCode));
                        continue;
                    }
                    Integer order = r.integer(I_ORDER);
                    itemsByTemplate.computeIfAbsent(tCode.toLowerCase(Locale.ROOT), k -> new ArrayList<>())
                            .add(new Item(crit.get().getId(), order != null ? order : Integer.MAX_VALUE, r.number()));
                } catch (ExcelCellException e) {
                    session.error(r, e.column(), e.getMessage());
                }
            }

            Map<String, String> fields = Map.of("code", T_CODE, "name", T_NAME, "companyId", T_COMPANY,
                    "inspectionType", T_TYPE, "description", T_DESC, "criterionIds", I_CRITERION);
            session.rows(templateRows, row -> {
                String code = row.text(T_CODE);
                Optional<InspectionTemplate> existing = code == null ? Optional.empty() : templateRepository.findByCodeIgnoreCase(code);
                List<Item> items = code == null ? null : itemsByTemplate.get(code.toLowerCase(Locale.ROOT));
                List<Long> criterionIds;
                if (items != null) {
                    criterionIds = items.stream().sorted(Comparator.comparingInt(Item::order).thenComparingInt(Item::line))
                            .map(Item::criterionId).toList();
                } else if (existing.isPresent()) {
                    criterionIds = existing.get().getItems().stream().map(TemplateItem::getCriterionId).toList();
                } else {
                    throw new ExcelCellException(T_CODE, "Mẫu mới chưa có tiêu chí: thêm dòng ở sheet \"Tiêu chí trong mẫu\"");
                }
                TemplateRequest req = session.validate(new TemplateRequest(code, row.text(T_NAME),
                        row.text(T_TYPE), row.text(T_DESC),
                        companyId(row.text(T_COMPANY), T_COMPANY), criterionIds, row.bool(ACTIVE, true)), row, fields);
                if (existing.isPresent()) {
                    templateService.update(existing.get().getId(), req, actorId);
                    return Outcome.UPDATED;
                }
                templateService.create(req, actorId);
                return Outcome.CREATED;
            });
            return session.finish();
        }
    }

    /** Map bất biến không cho get(null): nhóm / mẫu dùng chung không có công ty. */
    private static String companyCode(Map<Long, CompanyRef> companies, Long companyId) {
        CompanyRef c = companyId == null ? null : companies.get(companyId);
        return c == null ? null : c.code();
    }

    private Long companyId(String code, String column) {
        if (code == null) {
            return null;
        }
        return companyLookupApi.findByCode(code).map(CompanyRef::id)
                .orElseThrow(() -> new ExcelCellException(column, "Không tìm thấy công ty có mã \"%s\"".formatted(code)));
    }

    // ---------- Phân loại rủi ro (danh mục 7) ----------

    private record RiskLevelRow(String code, String name, BigDecimal maxScore, Integer remediationDays, String action, LocalDate effectiveFrom) {}

    private static ExcelSheet<RiskLevelRow> riskLevelSheet(List<RiskLevelRow> rows) {
        return ExcelSheet.of("Phân loại rủi ro", "BẢNG PHÂN LOẠI MỨC RỦI RO", rows)
                .column(R_CODE, 14, RiskLevelRow::code).required().note("Mã mức (VD: M1, M2, M3, M4).")
                .column(R_NAME, 24, RiskLevelRow::name).required().note("Tên mức rủi ro (VD: Thấp, Trung bình, Cao, Nghiêm trọng).")
                .column(R_MAX, 18, RiskLevelRow::maxScore).note("Điểm trần (<). Mức cao nhất để trống = không giới hạn trên.")
                .column(R_DAYS, 22, RiskLevelRow::remediationDays).required().note("Hạn khắc phục tính theo ngày (số nguyên > 0).")
                .column(R_ACTION, 45, RiskLevelRow::action).wrap().note("Hành động bắt buộc khi xảy ra vi phạm.")
                .column(R_EFFECTIVE, 18, RiskLevelRow::effectiveFrom).note("Ngày bắt đầu hiệu lực (YYYY-MM-DD). Để trống = hôm nay.");
    }

    public byte[] exportRiskLevels() {
        List<RiskLevel> levels = riskLevelRepository.findAllByOrderByEffectiveFromDescMinScoreAsc();
        List<RiskLevelRow> rows = levels.stream().map(r -> new RiskLevelRow(
                r.getCode(), r.getName(), r.getMaxScore(), r.getRemediationDays(), r.getAction(), r.getEffectiveFrom()
        )).toList();
        return ExcelWriter.export(List.of(riskLevelSheet(rows)));
    }

    public byte[] riskLevelsTemplate() {
        LocalDate today = BusinessDates.today(clock);
        List<RiskLevelRow> sample = List.of(
                new RiskLevelRow("M1", "Thấp", BigDecimal.valueOf(1.0), 60, "Theo dõi và chuẩn hoá", today),
                new RiskLevelRow("M2", "Trung bình", BigDecimal.valueOf(6.0), 30, "Khắc phục có kế hoạch", today),
                new RiskLevelRow("M3", "Cao", BigDecimal.valueOf(12.0), 7, "Khắc phục, phòng ngừa và kiểm tra lại", today),
                new RiskLevelRow("M4", "Nghiêm trọng", null, 1, "Lập biên bản, báo cáo lãnh đạo", today)
        );
        return ExcelWriter.template(List.of(riskLevelSheet(sample)), List.of(
                "Cấu hình các mức rủi ro M1–M4 theo khoảng điểm liền nhau.",
                "Điểm bắt đầu tự tính từ 0. Điểm trần của mức trước là điểm sàn của mức kế tiếp.",
                "Mức rủi ro cao nhất (cuối cùng) để trống ô Điểm trần (<) nghĩa là không giới hạn trên.",
                "Ngày hiệu lực có thể để trống (mặc định lấy hôm nay) hoặc đặt ngày trong tương lai."
        ));
    }

    @Transactional
    public ImportResult importRiskLevels(MultipartFile file, boolean commit, Long actorId) {
        try (ExcelImportFile excel = ExcelImportFile.open(file)) {
            List<ExcelRow> rows = excel.rows(riskLevelSheet(List.of()), false);
            if (rows.isEmpty()) {
                throw new BusinessException(ErrorCode.EXCEL_INVALID_FILE,
                        "File không có dòng dữ liệu nào ở sheet \"Phân loại rủi ro\"");
            }
            ExcelImporter.Session session = importer.start(commit);

            // Gom các dòng theo ngày hiệu lực
            Map<LocalDate, List<ExcelRow>> byDate = new LinkedHashMap<>();
            LocalDate defaultDate = BusinessDates.today(clock);
            for (ExcelRow r : rows) {
                LocalDate d = r.date(R_EFFECTIVE);
                if (d == null) d = defaultDate;
                byDate.computeIfAbsent(d, k -> new ArrayList<>()).add(r);
            }

            for (Map.Entry<LocalDate, List<ExcelRow>> entry : byDate.entrySet()) {
                LocalDate effDate = entry.getKey();
                List<ExcelRow> groupRows = entry.getValue();
                List<RiskLevelItem> items = new ArrayList<>();
                BigDecimal min = BigDecimal.ZERO;

                for (ExcelRow r : groupRows) {
                    String code = r.text(R_CODE);
                    String name = r.text(R_NAME);
                    BigDecimal max = r.decimal(R_MAX);
                    Integer days = r.integer(R_DAYS);
                    String action = r.text(R_ACTION);

                    if (code == null || code.isBlank()) {
                        throw new ExcelCellException(R_CODE, "Mã mức không được để trống");
                    }
                    if (name == null || name.isBlank()) {
                        throw new ExcelCellException(R_NAME, "Tên mức không được để trống");
                    }
                    if (days == null || days <= 0) {
                        throw new ExcelCellException(R_DAYS, "Hạn khắc phục phải lớn hơn 0");
                    }

                    items.add(new RiskLevelItem(code, name, min, max, days, action));
                    if (max != null) {
                        min = max;
                    }
                }

                session.rows(groupRows, row -> {
                    if (row == groupRows.get(groupRows.size() - 1)) {
                        if (commit) {
                            riskConfigService.saveRiskLevelVersion(new RiskLevelVersionRequest(effDate, items), actorId);
                        }
                        return Outcome.CREATED;
                    }
                    return Outcome.CREATED;
                });
            }
            return session.finish();
        }
    }
}

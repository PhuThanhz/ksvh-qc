package vn.ksvh.qc.inspection;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import vn.ksvh.qc.inspection.domain.Finding;
import vn.ksvh.qc.inspection.domain.FindingRepository;
import vn.ksvh.qc.inspection.domain.FindingStatus;
import vn.ksvh.qc.inspection.domain.InspectionItem;
import vn.ksvh.qc.inspection.domain.InspectionItemRepository;
import vn.ksvh.qc.inspection.domain.InspectionKind;
import vn.ksvh.qc.inspection.domain.InspectionMode;
import vn.ksvh.qc.inspection.domain.InspectionStatus;
import vn.ksvh.qc.inspection.domain.ItemResult;
import vn.ksvh.qc.inspection.domain.PlanStatus;
import vn.ksvh.qc.inspection.dto.InspectionBatchCreateRequest;
import vn.ksvh.qc.inspection.dto.InspectionCheckinRequest;
import vn.ksvh.qc.inspection.dto.InspectionCreateRequest;
import vn.ksvh.qc.inspection.dto.InspectionSubmitItemRequest;
import vn.ksvh.qc.inspection.dto.InspectionSubmitRequest;
import vn.ksvh.qc.inspection.dto.PlanAssignmentRequest;
import vn.ksvh.qc.inspection.dto.PlanCreateRequest;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.support.ApiTestSupport;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for Plan 5:
 * - Verification inspections (VERIFICATION kind)
 * - Surprise inspection suggestions (M3/M4 / high risk)
 * - Monthly planning warnings (unresolved findings from prior month)
 */
class VerificationAndSurpriseFlowTests extends ApiTestSupport {

    private static final String[] QC_PERMS = {
            PermissionCodes.PLAN_READ, PermissionCodes.PLAN_CREATE,
            PermissionCodes.INSPECTION_READ_ALL, PermissionCodes.INSPECTION_PERFORM,
            PermissionCodes.FINDING_RESPOND, PermissionCodes.FINDING_VERIFY,
            PermissionCodes.CRITERIA_READ
    };

    private static final LocalDate TODAY = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));

    @Autowired
    private FindingRepository findingRepository;

    @Autowired
    private InspectionItemRepository itemRepository;

    @Autowired
    private jakarta.persistence.EntityManager em;

    @Test
    void completeVerificationInspectionLifecycle() throws Exception {
        long qcUser = insertUser("qc_ver", RoleCodes.KSVH_INSPECTOR);
        long chtUser = insertUser("cht_ver", RoleCodes.STORE_MANAGER);
        long companyId = createCompany("C-VER-" + suffix);
        long storeId = createStore(companyId, "ST-VER-" + suffix, 10.762622, 106.660172, 150, chtUser);
        long groupId = createCriterionGroup("GRP-VER-" + suffix);
        long c1 = createCriterion(groupId, "C1-VER-" + suffix, 2);
        long c2 = createCriterion(groupId, "C2-VER-" + suffix, 4);
        long templateId = createTemplate("TPL-VER-" + suffix, List.of(c1, c2));

        // 1. Tạo 1 phiếu ban đầu để có inspection và items
        long origInsId = createInspectionDirectly("ORIG-INS-" + suffix, storeId, qcUser, templateId);
        List<InspectionItem> origItems = itemRepository.findAll().stream()
                .filter(it -> it.getInspection().getId().equals(origInsId))
                .toList();
        assertThat(origItems).hasSize(2);

        // 2. Tạo 2 lỗi ở trạng thái PENDING_VERIFICATION
        Finding f1 = createFindingDirectly(origInsId, origItems.get(0).getId(), storeId, c1, (short) 2, "M2", FindingStatus.PENDING_VERIFICATION);
        f1.setRemediationPlan("Đã sửa chữa thiết bị c1");
        f1.setRemediationEvidenceUrls("evidence_c1.jpg");
        findingRepository.saveAndFlush(f1);

        Finding f2 = createFindingDirectly(origInsId, origItems.get(1).getId(), storeId, c2, (short) 4, "M4", FindingStatus.PENDING_VERIFICATION);
        f2.setRemediationPlan("Đã tổng vệ sinh c2");
        f2.setRemediationEvidenceUrls("evidence_c2.jpg");
        findingRepository.saveAndFlush(f2);

        // 3. Candidate findings API (chỉ trả về các lỗi PENDING_VERIFICATION)
        mvc.perform(get("/api/v1/findings/verification-candidates")
                        .param("restaurantId", String.valueOf(storeId))
                        .with(as(qcUser, QC_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].remediationPlan").isNotEmpty());

        // 3b. Tạo lỗi REMEDIATING (chưa nộp bằng chứng) -> không thể đưa vào phiếu VERIFICATION
        Finding fRem = createFindingDirectly(origInsId, origItems.get(0).getId(), storeId, c1, (short) 2, "M2", FindingStatus.REMEDIATING);
        InspectionCreateRequest badReq = new InspectionCreateRequest(
                "VER-BAD-" + suffix, null, storeId, null, qcUser,
                InspectionKind.VERIFICATION, InspectionMode.REMOTE, null, "Test", List.of(fRem.getId())
        );
        mvc.perform(withJson(post("/api/v1/inspections"), badReq).with(as(qcUser, QC_PERMS)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("chưa gửi bằng chứng khắc phục")));

        // 4. Tạo phiếu kiểm tra khắc phục (VERIFICATION)
        InspectionCreateRequest createReq = new InspectionCreateRequest(
                "VER-TEST-" + suffix,
                null,
                storeId,
                null,
                qcUser,
                InspectionKind.VERIFICATION,
                InspectionMode.REMOTE,
                null,
                "Kiểm tra kết quả khắc phục từ xa",
                List.of(f1.getId(), f2.getId())
        );

        String createRes = mvc.perform(withJson(post("/api/v1/inspections"), createReq).with(as(qcUser, QC_PERMS)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.inspectionType").value("VERIFICATION"))
                .andExpect(jsonPath("$.status").value("ASSIGNED"))
                .andReturn().getResponse().getContentAsString();

        long verInsId = extractId(createRes);

        // 5. Kiểm tra danh sách items của phiếu VERIFICATION
        mvc.perform(get("/api/v1/inspections/" + verInsId + "/items").with(as(qcUser, QC_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].findingId").isNumber())
                .andExpect(jsonPath("$[0].remediationPlan").isNotEmpty());

        // 6. Checkin (REMOTE mode -> locationStatus REMOTE)
        mvc.perform(withJson(post("/api/v1/inspections/" + verInsId + "/checkin"), new InspectionCheckinRequest(null, null))
                        .with(as(qcUser, QC_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.locationStatus").value("REMOTE"));

        // 7. Submit kết quả: Item 1 = PASS, Item 2 = FAIL
        List<InspectionItem> verItems = itemRepository.findAll().stream()
                .filter(it -> it.getInspection().getId().equals(verInsId))
                .toList();

        InspectionSubmitRequest submitReq = new InspectionSubmitRequest(
                List.of(
                        new InspectionSubmitItemRequest(verItems.get(0).getId(), verItems.get(0).getCriterionId(), ItemResult.PASS, "Đạt chuẩn", null, f1.getId()),
                        new InspectionSubmitItemRequest(verItems.get(1).getId(), verItems.get(1).getCriterionId(), ItemResult.FAIL, "Chưa khắc phục triệt để", null, f2.getId())
                ),
                "Nghiệm thu hoàn tất"
        );

        mvc.perform(withJson(post("/api/v1/inspections/" + verInsId + "/submit"), submitReq).with(as(qcUser, QC_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        // 8. Kiểm tra kết quả trên các lỗi
        Finding updatedF1 = findingRepository.findById(f1.getId()).orElseThrow();
        assertThat(updatedF1.getStatus()).isEqualTo(FindingStatus.CLOSED);
        assertThat(updatedF1.getVerifiedBy()).isEqualTo(qcUser);

        Finding updatedF2 = findingRepository.findById(f2.getId()).orElseThrow();
        assertThat(updatedF2.getStatus()).isEqualTo(FindingStatus.CONFIRMED);
        assertThat(updatedF2.getViolationCount()).isGreaterThan(1);
        assertThat(updatedF2.getDeadlineDate()).isAfterOrEqualTo(TODAY);
    }

    @Test
    void verificationInspectionValidationErrors() throws Exception {
        long qcUser = insertUser("qc_err", RoleCodes.KSVH_INSPECTOR);
        long companyId = createCompany("C-ERR-" + suffix);
        long storeId = createStore(companyId, "ST-ERR-" + suffix, 10.762622, 106.660172, 150, qcUser);

        // Nhà hàng không có lỗi chờ nghiệm thu -> Tạo phiếu VERIFICATION báo lỗi
        InspectionCreateRequest createReq = new InspectionCreateRequest(
                "VER-EMPTY-" + suffix,
                null,
                storeId,
                null,
                qcUser,
                InspectionKind.VERIFICATION,
                InspectionMode.ON_SITE,
                null,
                "Test rỗng"
        );

        mvc.perform(withJson(post("/api/v1/inspections"), createReq).with(as(qcUser, QC_PERMS)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Nhà hàng này hiện không có lỗi nào đang chờ nghiệm thu kết quả khắc phục"));

        // Batch create không cho phép VERIFICATION
        InspectionBatchCreateRequest batchReq = new InspectionBatchCreateRequest(
                "VER-BATCH",
                null,
                List.of(storeId),
                null,
                qcUser,
                InspectionKind.VERIFICATION,
                InspectionMode.ON_SITE,
                null,
                "Batch verification"
        );

        mvc.perform(withJson(post("/api/v1/inspections/batch"), batchReq).with(as(qcUser, QC_PERMS)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Phiếu kiểm tra kết quả khắc phục chỉ được tạo đơn lẻ cho từng nhà hàng"));
    }

    @Test
    void surpriseInspectionSuggestionsDetectsHighRisk() throws Exception {
        long qcUser = insertUser("qc_sug", RoleCodes.KSVH_INSPECTOR);
        long companyId = createCompany("C-SUG-" + suffix);
        long storeId = createStore(companyId, "ST-SUG-" + suffix, 10.762622, 106.660172, 150, qcUser);
        long groupId = createCriterionGroup("GRP-SUG-" + suffix);
        long c1 = createCriterion(groupId, "C1-SUG-" + suffix, 5);
        long templateId = createTemplate("TPL-SUG-" + suffix, List.of(c1));

        long insId = createInspectionDirectly("SUG-INS-" + suffix, storeId, qcUser, templateId);
        List<InspectionItem> items = itemRepository.findAll().stream()
                .filter(it -> it.getInspection().getId().equals(insId))
                .toList();

        // Tạo 1 lỗi M4 đang mở
        createFindingDirectly(insId, items.get(0).getId(), storeId, c1, (short) 5, "M4", FindingStatus.CONFIRMED);

        // Gọi API đề xuất kiểm tra đột xuất
        mvc.perform(get("/api/v1/inspections/surprise-suggestions").with(as(qcUser, QC_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.restaurantId == " + storeId + ")].highestRiskLevel").value("M4"))
                .andExpect(jsonPath("$[?(@.restaurantId == " + storeId + ")].m4Count").value(1))
                .andExpect(jsonPath("$[?(@.restaurantId == " + storeId + ")].primaryReason").isNotEmpty())
                .andExpect(jsonPath("$[?(@.restaurantId == " + storeId + ")].suggestedTopicGroupIds[0]").value((int) groupId));
    }

    @Test
    void monthlyPlanningWarningsAndPriorUnresolvedFindings() throws Exception {
        long qcUser = insertUser("qc_plan_warn", RoleCodes.KSVH_INSPECTOR);
        long companyId = createCompany("C-PW-" + suffix);
        long storeId = createStore(companyId, "ST-PW-" + suffix, 10.762622, 106.660172, 150, qcUser);
        long groupId = createCriterionGroup("GRP-PW-" + suffix);
        long c1 = createCriterion(groupId, "C1-PW-" + suffix, 3);
        long templateId = createTemplate("TPL-PW-" + suffix, List.of(c1));

        long insId = createInspectionDirectly("PW-INS-" + suffix, storeId, qcUser, templateId);
        List<InspectionItem> items = itemRepository.findAll().stream()
                .filter(it -> it.getInspection().getId().equals(insId))
                .toList();

        // Tạo 1 lỗi tồn đọng từ tháng trước
        Finding oldFinding = createFindingDirectly(insId, items.get(0).getId(), storeId, c1, (short) 3, "M3", FindingStatus.PENDING_VERIFICATION);
        jdbc.update("UPDATE findings SET created_at = ? WHERE id = ?",
                Timestamp.valueOf(TODAY.minusMonths(1).atStartOfDay()), oldFinding.getId());
        em.clear();

        // 1. Kiểm tra API cảnh báo nhà hàng
        mvc.perform(get("/api/v1/inspection-plans/restaurant-warnings")
                        .param("restaurantId", String.valueOf(storeId))
                        .param("beforeDate", TODAY.toString())
                        .with(as(qcUser, QC_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.restaurantId").value((int) storeId))
                .andExpect(jsonPath("$.unverifiedCount").value(1))
                .andExpect(jsonPath("$.totalUnresolvedCount").value(1))
                .andExpect(jsonPath("$.warningDetails.length()").value(1));

        // 2. Tạo kế hoạch và kiểm tra priorUnresolvedCount trong dòng phân công
        PlanCreateRequest planReq = new PlanCreateRequest(
                "PLAN-WARN-" + suffix,
                "Kế hoạch tháng mới " + suffix,
                TODAY,
                TODAY.plusDays(15),
                "Ghi chú",
                List.of(new PlanAssignmentRequest(storeId, qcUser, templateId, TODAY.plusDays(2)))
        );

        String planRes = mvc.perform(withJson(post("/api/v1/inspection-plans"), planReq).with(as(qcUser, QC_PERMS)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long planId = extractId(planRes);

        // Xem chi tiết kế hoạch: assignment phải có priorUnresolvedCount >= 1
        mvc.perform(get("/api/v1/inspection-plans/" + planId).with(as(qcUser, QC_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignments[0].priorUnresolvedCount").value(1));
    }

    private long createCompany(String code) {
        return jdbc.queryForObject(
                "INSERT INTO companies(code, name, active, created_at, updated_at) " +
                        "VALUES (?, ?, true, NOW(), NOW()) RETURNING id",
                Long.class, code, "Công ty " + code);
    }

    private long createStore(long companyId, String code, double lat, double lng, int radius, long storeManagerId) {
        return jdbc.queryForObject(
                "INSERT INTO org_units(company_id, code, name, unit_type, latitude, longitude, checkin_radius_m, store_manager_user_id, active, created_at, updated_at) " +
                        "VALUES (?, ?, ?, 'RESTAURANT', ?, ?, ?, ?, true, NOW(), NOW()) RETURNING id",
                Long.class, companyId, code, "Cửa hàng " + code, lat, lng, radius, storeManagerId);
    }

    private long createCriterionGroup(String code) {
        return jdbc.queryForObject(
                "INSERT INTO criterion_groups(code, name, active, created_at, updated_at) " +
                        "VALUES (?, ?, true, NOW(), NOW()) RETURNING id",
                Long.class, code, "Nhóm " + code);
    }

    private long createCriterion(long groupId, String code, int impact) {
        return jdbc.queryForObject(
                "INSERT INTO criteria(group_id, code, name, base_impact, active, created_at, updated_at) " +
                        "VALUES (?, ?, ?, ?, true, NOW(), NOW()) RETURNING id",
                Long.class, groupId, code, "Tiêu chí " + code, impact);
    }

    private long createTemplate(String code, List<Long> criteriaIds) {
        Long templateId = jdbc.queryForObject(
                "INSERT INTO inspection_templates(code, name, active, created_at, updated_at) " +
                        "VALUES (?, ?, true, NOW(), NOW()) RETURNING id",
                Long.class, code, "Mẫu " + code);

        for (int i = 0; i < criteriaIds.size(); i++) {
            jdbc.update(
                    "INSERT INTO template_criteria(template_id, criterion_id, sort_order) VALUES (?, ?, ?)",
                    templateId, criteriaIds.get(i), i + 1);
        }
        return templateId;
    }

    private long extractId(String json) {
        return ((Number) com.jayway.jsonpath.JsonPath.read(json, "$.id")).longValue();
    }

    private long createInspectionDirectly(String code, long restaurantId, long inspectorId, long templateId) {
        jdbc.update("INSERT INTO inspections (code, restaurant_id, template_id, inspector_id, inspection_type, inspection_mode, status, created_at, updated_at) " +
                        "VALUES (?, ?, ?, ?, 'PERIODIC', 'ON_SITE', 'ASSIGNED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                code, restaurantId, templateId, inspectorId);
        Long id = jdbc.queryForObject("SELECT id FROM inspections WHERE code = ?", Long.class, code);

        List<Long> critIds = jdbc.queryForList("SELECT criterion_id FROM template_criteria WHERE template_id = ?", Long.class, templateId);
        int order = 1;
        for (Long cId : critIds) {
            String cCode = jdbc.queryForObject("SELECT code FROM criteria WHERE id = ?", String.class, cId);
            String cName = jdbc.queryForObject("SELECT name FROM criteria WHERE id = ?", String.class, cId);
            short impact = jdbc.queryForObject("SELECT base_impact FROM criteria WHERE id = ?", Short.class, cId);
            jdbc.update("INSERT INTO inspection_items (inspection_id, criterion_id, criterion_code, criterion_name, base_impact, result, sort_order) " +
                            "VALUES (?, ?, ?, ?, ?, 'UNRATED', ?)",
                    id, cId, cCode, cName, impact, order++);
        }
        return id;
    }

    private Finding createFindingDirectly(long inspectionId, long itemId, long restaurantId, long criterionId, short baseImpact, String riskLevel, FindingStatus status) {
        Finding f = new Finding();
        f.setInspectionId(inspectionId);
        f.setInspectionItemId(itemId);
        f.setRestaurantId(restaurantId);
        f.setCriterionId(criterionId);
        f.setBaseImpact(baseImpact);
        f.setEffectiveImpact(baseImpact);
        f.setViolationCount(1);
        f.setCalculatedScore(riskLevel.equals("M4") ? 16 : riskLevel.equals("M3") ? 9 : 4);
        f.setRiskLevelCode(riskLevel);
        f.setRiskLevelName("Mức " + riskLevel);
        f.setRemediationDays(7);
        f.setDeadlineDate(TODAY.plusDays(7));
        f.setStatus(status);
        f.setDescription("Lỗi phát hiện tại tiêu chí #" + criterionId);
        Finding saved = findingRepository.saveAndFlush(f);
        jdbc.update("INSERT INTO finding_occurrences(restaurant_id, criterion_id, finding_id, source, occurred_at) " +
                        "VALUES (?, ?, ?, 'CONFIRMED', CURRENT_TIMESTAMP)",
                restaurantId, criterionId, saved.getId());
        return saved;
    }
}

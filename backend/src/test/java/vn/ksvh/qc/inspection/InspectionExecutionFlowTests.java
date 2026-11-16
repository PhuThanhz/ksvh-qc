package vn.ksvh.qc.inspection;

import org.junit.jupiter.api.Test;
import vn.ksvh.qc.inspection.domain.AppealConclusion;
import vn.ksvh.qc.inspection.domain.FindingStatus;
import vn.ksvh.qc.inspection.domain.InspectionKind;
import vn.ksvh.qc.inspection.domain.InspectionMode;
import vn.ksvh.qc.inspection.domain.InspectionStatus;
import vn.ksvh.qc.inspection.domain.ItemResult;
import vn.ksvh.qc.inspection.domain.PlanStatus;
import vn.ksvh.qc.inspection.dto.FindingAppealRequest;
import vn.ksvh.qc.inspection.dto.FindingConcludeAppealRequest;
import vn.ksvh.qc.inspection.dto.FindingRemediationPlanRequest;
import vn.ksvh.qc.inspection.dto.FindingSubmitRemediationRequest;
import vn.ksvh.qc.inspection.dto.FindingVerifyRequest;
import vn.ksvh.qc.inspection.dto.InspectionCancelRequest;
import vn.ksvh.qc.inspection.dto.InspectionCheckinRequest;
import vn.ksvh.qc.inspection.dto.InspectionCreateRequest;
import vn.ksvh.qc.inspection.dto.InspectionSubmitItemRequest;
import vn.ksvh.qc.inspection.dto.InspectionSubmitRequest;
import vn.ksvh.qc.inspection.dto.PlanCreateRequest;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.support.ApiTestSupport;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end integration tests for the full inspection lifecycle:
 * Plan -> Approve -> Start Inspection -> Checkin GPS -> Grade Items -> Complete ->
 * Generate Findings -> Appeal / Remediate -> Verify & Close.
 */
class InspectionExecutionFlowTests extends ApiTestSupport {

    private static final String[] PLAN_PERMS = {
            PermissionCodes.PLAN_READ, PermissionCodes.PLAN_CREATE, PermissionCodes.PLAN_APPROVE
    };

    private static final String[] QC_PERMS = {
            PermissionCodes.INSPECTION_READ_ALL, PermissionCodes.INSPECTION_PERFORM
    };

    private static final String[] OWN_QC_PERMS = {
            PermissionCodes.INSPECTION_READ_OWN, PermissionCodes.INSPECTION_PERFORM
    };

    private static final String[] STORE_PERMS = {
            PermissionCodes.FINDING_RESPOND, PermissionCodes.FINDING_REMEDIATE
    };

    private static final String[] QA_PERMS = {
            PermissionCodes.FINDING_CONCLUDE_APPEAL, PermissionCodes.FINDING_VERIFY
    };

    private static final LocalDate TODAY = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));

    @Test
    void completeEndToEndInspectionFlow() throws Exception {
        // 1. Setup Master Data
        long qcUser = insertUser("qc", RoleCodes.KSVH_INSPECTOR);
        long chtUser = insertUser("cht", RoleCodes.STORE_MANAGER);
        long qaUser = insertUser("qa", RoleCodes.KSVH_LEAD);

        long companyId = createCompany("C-" + suffix);
        long storeId = createStore(companyId, "STORE-" + suffix, 10.762622, 106.660172, 150, chtUser);
        long otherQc = insertUser("qc2", RoleCodes.KSVH_INSPECTOR);
        long otherCht = insertUser("cht2", RoleCodes.STORE_MANAGER);
        long groupId = createCriterionGroup("GRP-" + suffix);
        long c1 = createCriterion(groupId, "C1-" + suffix, 2);
        long c2 = createCriterion(groupId, "C2-" + suffix, 4);
        long cOff = createCriterion(groupId, "C3-" + suffix, 1);
        jdbc.update("UPDATE criteria SET active = false WHERE id = ?", cOff);
        // Thứ tự trong mẫu: c2 trước c1; tiêu chí đã ngưng không được đưa vào phiếu
        long templateId = createTemplate("TPL-" + suffix, List.of(c2, cOff, c1));

        // 2. Inspection Plan Creation
        PlanCreateRequest planReq = new PlanCreateRequest(
                "PLAN-" + suffix,
                "Kế hoạch tháng " + suffix,
                TODAY,
                TODAY.plusDays(7),
                "Ghi chú kiểm tra định kỳ"
        );

        String planRes = mvc.perform(withJson(post("/api/v1/inspection-plans"), planReq).with(as(1L, PLAN_PERMS)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(PlanStatus.DRAFT.name()))
                .andReturn().getResponse().getContentAsString();

        long planId = extractId(planRes);

        // Submit plan
        mvc.perform(post("/api/v1/inspection-plans/" + planId + "/submit").with(as(1L, PLAN_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(PlanStatus.PENDING_APPROVAL.name()));

        // Approve plan
        mvc.perform(post("/api/v1/inspection-plans/" + planId + "/approve").with(as(2L, PLAN_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(PlanStatus.APPROVED.name()));

        // 3. Create Inspection under Plan
        InspectionCreateRequest insReq = new InspectionCreateRequest(
                "INS-" + suffix,
                planId,
                storeId,
                templateId,
                qcUser,
                InspectionKind.PERIODIC,
                null,
                null,
                "Đợt kiểm tra " + suffix
        );

        String insRes = mvc.perform(withJson(post("/api/v1/inspections"), insReq).with(as(qcUser, QC_PERMS)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(InspectionStatus.ASSIGNED.name()))
                .andReturn().getResponse().getContentAsString();

        long insId = extractId(insRes);

        // Fetch inspection items
        mvc.perform(get("/api/v1/inspections/" + insId + "/items").with(as(qcUser, QC_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].criterionId").value(c2))
                .andExpect(jsonPath("$[1].criterionId").value(c1));

        // 4. GPS Check-in (within 150m)
        InspectionCheckinRequest checkinReq = new InspectionCheckinRequest(
                10.762620,
                106.660170
        );

        // Chuyên viên khác không được check-in / xem phiếu không giao cho mình
        mvc.perform(withJson(post("/api/v1/inspections/" + insId + "/checkin"), checkinReq).with(as(otherQc, OWN_QC_PERMS)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/inspections/" + insId).with(as(otherQc, OWN_QC_PERMS)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/inspections").with(as(otherQc, OWN_QC_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(0));

        // Chưa check-in thì không được gửi kết quả
        InspectionSubmitRequest earlySubmit = new InspectionSubmitRequest(
                List.of(new InspectionSubmitItemRequest(c1, ItemResult.PASS, null, null),
                        new InspectionSubmitItemRequest(c2, ItemResult.PASS, null, null)), null);
        mvc.perform(withJson(post("/api/v1/inspections/" + insId + "/submit"), earlySubmit).with(as(qcUser, QC_PERMS)))
                .andExpect(status().isConflict());

        mvc.perform(withJson(post("/api/v1/inspections/" + insId + "/checkin"), checkinReq).with(as(qcUser, QC_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(InspectionStatus.IN_PROGRESS.name()))
                .andExpect(jsonPath("$.locationStatus").value("VERIFIED"));

        // Thiếu tiêu chí → từ chối; không đạt mà không có bằng chứng → từ chối
        mvc.perform(withJson(post("/api/v1/inspections/" + insId + "/submit"),
                        new InspectionSubmitRequest(List.of(new InspectionSubmitItemRequest(c1, ItemResult.PASS, null, null)), null))
                        .with(as(qcUser, QC_PERMS)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INSPECTION_INCOMPLETE"));
        mvc.perform(withJson(post("/api/v1/inspections/" + insId + "/submit"),
                        new InspectionSubmitRequest(List.of(
                                new InspectionSubmitItemRequest(c1, ItemResult.PASS, null, null),
                                new InspectionSubmitItemRequest(c2, ItemResult.FAIL, "Có rác", null)), null))
                        .with(as(qcUser, QC_PERMS)))
                .andExpect(status().isBadRequest());

        // 5. Submit Inspection with Evaluations
        InspectionSubmitRequest submitReq = new InspectionSubmitRequest(
                List.of(
                        new InspectionSubmitItemRequest(c1, ItemResult.PASS, "Khu vực sạch sẽ đạt chuẩn", null),
                        new InspectionSubmitItemRequest(c2, ItemResult.FAIL, "Phát hiện rác tồn đọng sau quầy", "https://img.jpg")
                ),
                "Hoàn thành kiểm tra thực tế"
        );

        mvc.perform(withJson(post("/api/v1/inspections/" + insId + "/submit"), submitReq).with(as(qcUser, QC_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(InspectionStatus.SUBMITTED.name()))
                // Điểm tuân thủ: c1 (trọng số 2) đạt, c2 (trọng số 4) không đạt → 2 / 6 = 33,33%
                .andExpect(jsonPath("$.complianceScore").value(33.33));

        // 6. Verify Finding Generated
        String findingsJson = mvc.perform(get("/api/v1/findings").param("inspectionId", String.valueOf(insId)).with(as(qcUser, QC_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(1))
                .andReturn().getResponse().getContentAsString();

        long findingId = jsonMapper.readTree(findingsJson).get("items").get(0).get("id").asLong();

        // Phiếu đã gửi không huỷ được
        mvc.perform(withJson(post("/api/v1/inspections/" + insId + "/cancel"), new InspectionCancelRequest("Huỷ thử"))
                        .with(as(qaUser, PermissionCodes.INSPECTION_CANCEL)))
                .andExpect(status().isConflict());

        // CHT của nhà hàng khác không được khiếu nại / xác nhận
        mvc.perform(post("/api/v1/findings/" + findingId + "/confirm").with(as(otherCht, STORE_PERMS)))
                .andExpect(status().isForbidden());

        // 7. Finding Appeal Flow
        FindingAppealRequest appealReq = new FindingAppealRequest(
                "Lỗi này do bên nhà thầu vệ sinh chưa đến giờ làm việc",
                "https://res.cloudinary.com/contract.pdf"
        );
        mvc.perform(withJson(post("/api/v1/findings/" + findingId + "/appeal"), appealReq).with(as(chtUser, STORE_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(FindingStatus.APPEALED.name()));

        // QA concludes appeal: UPHELD (giữ lỗi -> CONFIRMED)
        FindingConcludeAppealRequest concludeReq = new FindingConcludeAppealRequest(
                AppealConclusion.UPHELD
        );
        mvc.perform(withJson(post("/api/v1/findings/" + findingId + "/conclude-appeal"), concludeReq).with(as(qaUser, QA_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(FindingStatus.CONFIRMED.name()));

        // 8. Remediation Flow
        FindingRemediationPlanRequest planRemReq = new FindingRemediationPlanRequest(
                "Nhân viên ca sáng quên kiểm tra khu vực sau quầy, sẽ bổ sung checklist",
                TODAY.plusYears(1)
        );
        // Ngày hẹn vượt hạn khắc phục của mức rủi ro → từ chối
        mvc.perform(withJson(post("/api/v1/findings/" + findingId + "/remediation-plan"), planRemReq).with(as(chtUser, STORE_PERMS)))
                .andExpect(status().isBadRequest());
        planRemReq = new FindingRemediationPlanRequest(planRemReq.remediationPlan(), TODAY);
        mvc.perform(withJson(post("/api/v1/findings/" + findingId + "/remediation-plan"), planRemReq).with(as(chtUser, STORE_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(FindingStatus.REMEDIATING.name()));

        // Store submits remediation proof
        FindingSubmitRemediationRequest submitRemReq = new FindingSubmitRemediationRequest(
                "https://res.cloudinary.com/cleaned_after.jpg"
        );
        mvc.perform(withJson(post("/api/v1/findings/" + findingId + "/submit-remediation"), submitRemReq).with(as(chtUser, STORE_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(FindingStatus.PENDING_VERIFICATION.name()));

        // 9. Verification & Closure
        FindingVerifyRequest verifyReq = new FindingVerifyRequest(
                true,
                "Đã kiểm tra lại qua ảnh chụp và checklist, đạt chuẩn"
        );
        // Chuyên viên không phụ trách phiếu không được nghiệm thu
        mvc.perform(withJson(post("/api/v1/findings/" + findingId + "/verify"), verifyReq)
                        .with(as(otherQc, PermissionCodes.INSPECTION_READ_OWN, PermissionCodes.FINDING_VERIFY)))
                .andExpect(status().isForbidden());
        mvc.perform(withJson(post("/api/v1/findings/" + findingId + "/verify"), verifyReq)
                        .with(as(qcUser, PermissionCodes.INSPECTION_READ_OWN, PermissionCodes.FINDING_VERIFY)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(FindingStatus.CLOSED.name()))
                .andExpect(jsonPath("$.history.length()").value(6));

        // Mọi lỗi đã đóng → phiếu hoàn thành
        mvc.perform(get("/api/v1/inspections/" + insId).with(as(qcUser, QC_PERMS)))
                .andExpect(jsonPath("$.status").value(InspectionStatus.COMPLETED.name()));
    }

    @Test
    void surpriseInspectionUsesTopicGroupsAndOnlyRecordsLocation() throws Exception {
        long qcUser = insertUser("qcs", RoleCodes.KSVH_INSPECTOR);
        long chtUser = insertUser("chts", RoleCodes.STORE_MANAGER);
        long companyId = createCompany("CS-" + suffix);
        long storeId = createStore(companyId, "SS-" + suffix, 10.762622, 106.660172, 100, chtUser);
        long noGpsStore = jdbc.queryForObject("INSERT INTO org_units(company_id, code, name, unit_type) VALUES (?, ?, 'Không GPS', 'RESTAURANT') RETURNING id",
                Long.class, companyId, "SN-" + suffix);
        long inventory = createCriterionGroup("TK-" + suffix);
        long other = createCriterionGroup("VS-" + suffix);
        long k1 = createCriterion(inventory, "TK1-" + suffix, 5);
        long k2 = createCriterion(inventory, "TK2-" + suffix, 3);
        createCriterion(other, "VS1-" + suffix, 1);
        long templateId = createTemplate("TPS-" + suffix, List.of(k1));

        // Đột xuất phải có chuyên đề; định kỳ không được làm từ xa
        mvc.perform(withJson(post("/api/v1/inspections"), new InspectionCreateRequest("SX0-" + suffix, null, storeId, null, qcUser,
                        InspectionKind.SURPRISE, InspectionMode.ON_SITE, List.of(), null)).with(as(qcUser, QC_PERMS)))
                .andExpect(status().isBadRequest());
        mvc.perform(withJson(post("/api/v1/inspections"), new InspectionCreateRequest("PX0-" + suffix, null, storeId, templateId, qcUser,
                        InspectionKind.PERIODIC, InspectionMode.REMOTE, null, null)).with(as(qcUser, QC_PERMS)))
                .andExpect(status().isBadRequest());

        // Chuyên đề tồn kho: chỉ 2 tiêu chí của nhóm, không lấy nhóm khác
        String res = mvc.perform(withJson(post("/api/v1/inspections"), new InspectionCreateRequest("SX1-" + suffix, null, storeId, null, qcUser,
                        InspectionKind.SURPRISE, InspectionMode.ON_SITE, List.of(inventory), null)).with(as(qcUser, QC_PERMS)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.inspectionType").value("SURPRISE"))
                .andExpect(jsonPath("$.totalCriteria").value(2))
                .andExpect(jsonPath("$.topicNames[0]").value("Nhóm TK-" + suffix))
                .andReturn().getResponse().getContentAsString();
        long onSite = extractId(res);

        // Ngoài bán kính: vẫn cho bắt đầu, chỉ ghi nhận
        mvc.perform(withJson(post("/api/v1/inspections/" + onSite + "/checkin"), new InspectionCheckinRequest(10.80, 106.70))
                        .with(as(qcUser, QC_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.locationStatus").value("OUTSIDE_RADIUS"));

        // Nhà hàng chưa khai toạ độ, thiết bị không có GPS → chưa xác minh vị trí
        long unverified = extractId(mvc.perform(withJson(post("/api/v1/inspections"), new InspectionCreateRequest("SX2-" + suffix, null, noGpsStore,
                        null, qcUser, InspectionKind.SURPRISE, InspectionMode.ON_SITE, List.of(inventory), null)).with(as(qcUser, QC_PERMS)))
                .andReturn().getResponse().getContentAsString());
        mvc.perform(withJson(post("/api/v1/inspections/" + unverified + "/checkin"), new InspectionCheckinRequest(null, null))
                        .with(as(qcUser, QC_PERMS)))
                .andExpect(jsonPath("$.locationStatus").value("UNVERIFIED"));

        // Từ xa
        long remote = extractId(mvc.perform(withJson(post("/api/v1/inspections"), new InspectionCreateRequest("SX3-" + suffix, null, storeId,
                        null, qcUser, InspectionKind.SURPRISE, InspectionMode.REMOTE, List.of(inventory), null)).with(as(qcUser, QC_PERMS)))
                .andReturn().getResponse().getContentAsString());
        mvc.perform(withJson(post("/api/v1/inspections/" + remote + "/checkin"), new InspectionCheckinRequest(null, null))
                        .with(as(qcUser, QC_PERMS)))
                .andExpect(jsonPath("$.locationStatus").value("REMOTE"));
    }

    private long insertUser(String prefix, String roleCode) {
        Long id = jdbc.queryForObject("""
                INSERT INTO users (username, password_hash, full_name, active) VALUES (?, '{noop}x', ?, true) RETURNING id
                """, Long.class, prefix + "_" + suffix.toLowerCase(), "Test " + prefix + " " + suffix);
        jdbc.update("INSERT INTO user_roles (user_id, role_id) SELECT ?, id FROM roles WHERE code = ?", id, roleCode);
        return id;
    }

    // Helper methods to populate DB entities
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
        return jsonMapper.readTree(json).get("id").asLong();
    }
}

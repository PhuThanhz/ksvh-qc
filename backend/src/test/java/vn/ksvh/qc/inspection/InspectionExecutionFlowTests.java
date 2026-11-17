package vn.ksvh.qc.inspection;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import vn.ksvh.qc.inspection.domain.AppealConclusion;
import vn.ksvh.qc.inspection.domain.AppealVerdict;
import vn.ksvh.qc.inspection.domain.FindingStatus;
import vn.ksvh.qc.inspection.domain.InspectionKind;
import vn.ksvh.qc.inspection.domain.InspectionMode;
import vn.ksvh.qc.inspection.domain.InspectionStatus;
import vn.ksvh.qc.inspection.domain.ItemResult;
import vn.ksvh.qc.inspection.domain.PlanStatus;
import vn.ksvh.qc.inspection.dto.AppealReviewRequest;
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
import vn.ksvh.qc.inspection.dto.PlanAssignmentRequest;
import vn.ksvh.qc.inspection.dto.PlanCreateRequest;
import vn.ksvh.qc.inspection.service.FindingService;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.support.ApiTestSupport;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
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
            PermissionCodes.FINDING_CONCLUDE_APPEAL, PermissionCodes.FINDING_VERIFY,
            PermissionCodes.FINDING_REVIEW_APPEAL, PermissionCodes.INSPECTION_READ_ALL
    };

    private static final LocalDate TODAY = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));

    @Autowired
    private FindingService findingService;

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
                "Ghi chú kiểm tra định kỳ",
                List.of(new PlanAssignmentRequest(storeId, qcUser, templateId, TODAY.plusDays(1)))
        );

        String planRes = mvc.perform(withJson(post("/api/v1/inspection-plans"), planReq).with(as(1L, PLAN_PERMS)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(PlanStatus.DRAFT.name()))
                .andExpect(jsonPath("$.assignmentCount").value(1))
                .andReturn().getResponse().getContentAsString();

        long planId = extractId(planRes);

        // Submit plan
        mvc.perform(post("/api/v1/inspection-plans/" + planId + "/submit").with(as(1L, PLAN_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(PlanStatus.PENDING_APPROVAL.name()));

        // Approve plan -> auto creates inspection (PER-<yyMM>-<storeCode>-01)
        String approvedPlanRes = mvc.perform(post("/api/v1/inspection-plans/" + planId + "/approve").with(as(2L, PLAN_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(PlanStatus.APPROVED.name()))
                .andExpect(jsonPath("$.assignments[0].inspectionId").isNumber())
                .andExpect(jsonPath("$.assignments[0].inspectionCode").value(org.hamcrest.Matchers.startsWith("PER-")))
                .andExpect(jsonPath("$.assignments[0].inspectionStatus").value(InspectionStatus.ASSIGNED.name()))
                .andReturn().getResponse().getContentAsString();

        long insId = jsonMapper.readTree(approvedPlanRes).get("assignments").get(0).get("inspectionId").asLong();

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

        // Ảnh bằng chứng: link ngoài, ảnh của người khác, ảnh chưa có trên kho → đều bị từ chối
        for (String bad : List.of("https://img.jpg", evidenceKey(otherQc))) {
            mvc.perform(withJson(post("/api/v1/inspections/" + insId + "/submit"), new InspectionSubmitRequest(List.of(
                            new InspectionSubmitItemRequest(c1, ItemResult.PASS, null, null),
                            new InspectionSubmitItemRequest(c2, ItemResult.FAIL, "Có rác", bad)), null))
                            .with(as(qcUser, QC_PERMS)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("EVIDENCE_INVALID"));
        }
        String missingKey = evidenceKey(qcUser);
        org.mockito.Mockito.when(objectStore.exists(missingKey)).thenReturn(false);
        mvc.perform(withJson(post("/api/v1/inspections/" + insId + "/submit"), new InspectionSubmitRequest(List.of(
                        new InspectionSubmitItemRequest(c1, ItemResult.PASS, null, null),
                        new InspectionSubmitItemRequest(c2, ItemResult.FAIL, "Có rác", missingKey)), null))
                        .with(as(qcUser, QC_PERMS)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("EVIDENCE_INVALID"));

        // 5. Submit Inspection with Evaluations
        InspectionSubmitRequest submitReq = new InspectionSubmitRequest(
                List.of(
                        new InspectionSubmitItemRequest(c1, ItemResult.PASS, "Khu vực sạch sẽ đạt chuẩn", null),
                        new InspectionSubmitItemRequest(c2, ItemResult.FAIL, "Phát hiện rác tồn đọng sau quầy", evidenceKey(qcUser))
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

        // 7. Finding Appeal Flow (Multi-reviewer with disagreement -> meeting -> conclude)
        FindingAppealRequest appealReq = new FindingAppealRequest(
                "Lỗi này do bên nhà thầu vệ sinh chưa đến giờ làm việc",
                evidenceKey(chtUser),
                List.of(qaUser, otherQc)
        );
        mvc.perform(withJson(post("/api/v1/findings/" + findingId + "/appeal"), appealReq).with(as(chtUser, STORE_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(FindingStatus.APPEALED.name()))
                .andExpect(jsonPath("$.appealReviews.length()").value(2));

        // Reviewer 1 (otherQc) votes FINDING_INVALID
        mvc.perform(withJson(post("/api/v1/findings/" + findingId + "/appeal-reviews"),
                        new AppealReviewRequest(AppealVerdict.FINDING_INVALID, "Cần xem xét trách nhiệm nhà thầu"))
                        .with(as(otherQc, QA_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(FindingStatus.APPEALED.name()));

        // Reviewer 2 (qaUser) votes FINDING_VALID -> disagreement triggers APPEAL_MEETING
        mvc.perform(withJson(post("/api/v1/findings/" + findingId + "/appeal-reviews"),
                        new AppealReviewRequest(AppealVerdict.FINDING_VALID, "Lỗi thuộc trách nhiệm ca trực"))
                        .with(as(qaUser, QA_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(FindingStatus.APPEAL_MEETING.name()));

        // QA concludes appeal: UPHELD (giữ lỗi -> CONFIRMED)
        FindingConcludeAppealRequest concludeReq = new FindingConcludeAppealRequest(
                AppealConclusion.UPHELD,
                "Biên bản họp: Thống nhất giữ lỗi vi phạm vệ sinh"
        );
        mvc.perform(withJson(post("/api/v1/findings/" + findingId + "/conclude-appeal"), concludeReq).with(as(qaUser, QA_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(FindingStatus.CONFIRMED.name()))
                .andExpect(jsonPath("$.appealConclusion").value(AppealConclusion.UPHELD.name()));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM finding_occurrences WHERE finding_id = ? AND source = 'APPEAL_UPHELD'",
                Integer.class, findingId)).isEqualTo(1);

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
                evidenceKey(chtUser)
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
                .andExpect(jsonPath("$.history.length()").value(9));

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

    @Test
    void inspectionWithoutFindingsWaitsForStoreManagerAcknowledgement() throws Exception {
        long qcUser = insertUser("qca", RoleCodes.KSVH_INSPECTOR);
        long chtUser = insertUser("chta", RoleCodes.STORE_MANAGER);
        long otherCht = insertUser("chtb", RoleCodes.STORE_MANAGER);
        long storeId = createStore(createCompany("CA-" + suffix), "SA-" + suffix, 10.762622, 106.660172, 150, chtUser);
        long crit = createCriterion(createCriterionGroup("GA-" + suffix), "CA1-" + suffix, 2);
        long templateId = createTemplate("TPA-" + suffix, List.of(crit));

        long insId = createApprovedPlanWithAssignment(storeId, qcUser, templateId, TODAY);
        mvc.perform(withJson(post("/api/v1/inspections/" + insId + "/checkin"), new InspectionCheckinRequest(10.762620, 106.660170))
                .with(as(qcUser, QC_PERMS))).andExpect(status().isOk());

        // Không có lỗi → chờ CHT xác nhận đã xem, chưa hoàn thành
        mvc.perform(withJson(post("/api/v1/inspections/" + insId + "/submit"), new InspectionSubmitRequest(List.of(
                        new InspectionSubmitItemRequest(crit, ItemResult.PASS, null, null)), null))
                        .with(as(qcUser, QC_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(InspectionStatus.AWAITING_ACK.name()))
                .andExpect(jsonPath("$.completedAt").doesNotExist());

        // CHT nhà hàng khác / Chuyên viên không xác nhận được
        mvc.perform(post("/api/v1/inspections/" + insId + "/acknowledge").with(as(otherCht, STORE_PERMS)))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/inspections/" + insId + "/acknowledge").with(as(qcUser, QC_PERMS)))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/inspections/" + insId + "/acknowledge").with(as(chtUser, STORE_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(InspectionStatus.COMPLETED.name()))
                .andExpect(jsonPath("$.acknowledgedAt").exists());
        assertThat(jdbc.queryForObject("SELECT acknowledged_by FROM inspections WHERE id = ?", Long.class, insId)).isEqualTo(chtUser);

        // Xác nhận lần nữa → không hợp lệ
        mvc.perform(post("/api/v1/inspections/" + insId + "/acknowledge").with(as(chtUser, STORE_PERMS)))
                .andExpect(status().isConflict());
    }

    @Test
    void overdueRemediationAddsOneOccurrencePerRoundAndOpensNewRound() throws Exception {
        long qcUser = insertUser("qco", RoleCodes.KSVH_INSPECTOR);
        long chtUser = insertUser("chto", RoleCodes.STORE_MANAGER);
        long storeId = createStore(createCompany("CO-" + suffix), "SO-" + suffix, 10.762622, 106.660172, 150, chtUser);
        long crit = createCriterion(createCriterionGroup("GO-" + suffix), "CO1-" + suffix, 3);
        long templateId = createTemplate("TPO-" + suffix, List.of(crit));

        long insId = createApprovedPlanWithAssignment(storeId, qcUser, templateId, TODAY);
        mvc.perform(withJson(post("/api/v1/inspections/" + insId + "/checkin"), new InspectionCheckinRequest(10.762620, 106.660170))
                .with(as(qcUser, QC_PERMS))).andExpect(status().isOk());
        mvc.perform(withJson(post("/api/v1/inspections/" + insId + "/submit"), new InspectionSubmitRequest(List.of(
                        new InspectionSubmitItemRequest(crit, ItemResult.FAIL, "Bẩn", evidenceKey(qcUser))), null))
                .with(as(qcUser, QC_PERMS))).andExpect(status().isOk());
        long findingId = jsonMapper.readTree(mvc.perform(get("/api/v1/findings").param("inspectionId", String.valueOf(insId))
                        .with(as(qcUser, QC_PERMS))).andReturn().getResponse().getContentAsString())
                .get("items").get(0).get("id").asLong();
        mvc.perform(post("/api/v1/findings/" + findingId + "/confirm").with(as(chtUser, STORE_PERMS))).andExpect(status().isOk());
        mvc.perform(withJson(post("/api/v1/findings/" + findingId + "/remediation-plan"),
                        new FindingRemediationPlanRequest("Vệ sinh lại", TODAY)).with(as(chtUser, STORE_PERMS)))
                .andExpect(status().isOk());

        // Lùi hạn về hôm qua → quá hạn
        jdbc.update("UPDATE findings SET deadline_date = ? WHERE id = ?", java.sql.Date.valueOf(TODAY.minusDays(1)), findingId);
        Integer before = jdbc.queryForObject("SELECT count(*) FROM finding_occurrences WHERE finding_id = ?", Integer.class, findingId);

        assertThat(findingService.markOverdueFindings()).isGreaterThanOrEqualTo(1);

        assertThat(jdbc.queryForObject("SELECT status FROM findings WHERE id = ?", String.class, findingId))
                .isEqualTo(FindingStatus.CONFIRMED.name());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM finding_occurrences WHERE finding_id = ? AND source = 'OVERDUE'",
                Integer.class, findingId)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT deadline_date FROM findings WHERE id = ?", java.sql.Date.class, findingId)
                .toLocalDate()).isAfter(TODAY);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM finding_events WHERE finding_id = ? AND action = 'OVERDUE' AND actor_id IS NULL",
                Integer.class, findingId)).isEqualTo(1);

        // Chạy lại cùng ngày: hạn mới ở tương lai nên không +1 lần nữa
        findingService.markOverdueFindings();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM finding_occurrences WHERE finding_id = ?", Integer.class, findingId))
                .isEqualTo(before + 1);
    }

    @Test
    void planAssignmentValidationAndPeriodicPlanRequirement() throws Exception {
        long qcUser = insertUser("qc_val", RoleCodes.KSVH_INSPECTOR);
        long chtUser = insertUser("cht_val", RoleCodes.STORE_MANAGER);
        long storeId1 = createStore(createCompany("CV1-" + suffix), "SV1-" + suffix, 10.76, 106.66, 150, chtUser);
        long storeId2 = createStore(createCompany("CV2-" + suffix), "SV2-" + suffix, 10.76, 106.66, 150, chtUser);
        long crit = createCriterion(createCriterionGroup("GV-" + suffix), "CV-" + suffix, 2);
        long templateId = createTemplate("TPV-" + suffix, List.of(crit));

        // 1. Tạo phiếu PERIODIC không có planId -> 400
        mvc.perform(withJson(post("/api/v1/inspections"), new InspectionCreateRequest("PER-NOPLAN", null, storeId1,
                        templateId, qcUser, InspectionKind.PERIODIC, null, null, null)).with(as(qcUser, QC_PERMS)))
                .andExpect(status().isBadRequest());

        // 2. Gửi duyệt kế hoạch rỗng (0 phân công) -> 400
        PlanCreateRequest emptyPlan = new PlanCreateRequest("PL-EMPTY-" + suffix, "Kế hoạch rỗng", TODAY, TODAY.plusDays(7), null, List.of());
        long emptyPlanId = extractId(mvc.perform(withJson(post("/api/v1/inspection-plans"), emptyPlan).with(as(1L, PLAN_PERMS)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        mvc.perform(post("/api/v1/inspection-plans/" + emptyPlanId + "/submit").with(as(1L, PLAN_PERMS)))
                .andExpect(status().isBadRequest());

        // 3. Trùng nhà hàng trong cùng một kế hoạch -> 400
        PlanCreateRequest duplicateStorePlan = new PlanCreateRequest("PL-DUP-" + suffix, "Kế hoạch trùng", TODAY, TODAY.plusDays(7), null,
                List.of(
                        new PlanAssignmentRequest(storeId1, qcUser, templateId, TODAY.plusDays(1)),
                        new PlanAssignmentRequest(storeId1, qcUser, templateId, TODAY.plusDays(2))
                ));
        mvc.perform(withJson(post("/api/v1/inspection-plans"), duplicateStorePlan).with(as(1L, PLAN_PERMS)))
                .andExpect(status().isBadRequest());

        // 4. Ngày phân công ngoài khoảng [startDate, endDate] -> 400
        PlanCreateRequest outOfRangePlan = new PlanCreateRequest("PL-OOR-" + suffix, "Kế hoạch lệch ngày", TODAY, TODAY.plusDays(3), null,
                List.of(
                        new PlanAssignmentRequest(storeId1, qcUser, templateId, TODAY.plusDays(10))
                ));
        mvc.perform(withJson(post("/api/v1/inspection-plans"), outOfRangePlan).with(as(1L, PLAN_PERMS)))
                .andExpect(status().isBadRequest());

        // 5. Chuyên viên không có vai trò KSVH_INSPECTOR -> 400
        PlanCreateRequest invalidInspectorPlan = new PlanCreateRequest("PL-BADQC-" + suffix, "Kế hoạch sai chuyên viên", TODAY, TODAY.plusDays(7), null,
                List.of(
                        new PlanAssignmentRequest(storeId1, chtUser, templateId, TODAY.plusDays(1))
                ));
        mvc.perform(withJson(post("/api/v1/inspection-plans"), invalidInspectorPlan).with(as(1L, PLAN_PERMS)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void multiReviewerAppealLifecycleAndValidation() throws Exception {
        long inspector = insertUser("qc_app", RoleCodes.KSVH_INSPECTOR);
        long chtUser = insertUser("cht_app", RoleCodes.STORE_MANAGER);
        long revLead = insertUser("lead_app", RoleCodes.KSVH_LEAD);
        long revManager = insertUser("mgr_app", RoleCodes.KSVH_MANAGER);
        long revObm = insertUser("obm_app", RoleCodes.OBM);
        long otherUser = insertUser("oth_app", RoleCodes.STORE_MANAGER);

        long companyId = createCompany("CAPP-" + suffix);
        long storeId = jdbc.queryForObject(
                "INSERT INTO org_units(company_id, code, name, unit_type, latitude, longitude, checkin_radius_m, store_manager_user_id, obm_user_id, active, created_at, updated_at) " +
                        "VALUES (?, ?, ?, 'RESTAURANT', ?, ?, ?, ?, ?, true, NOW(), NOW()) RETURNING id",
                Long.class, companyId, "SAPP-" + suffix, "Cửa hàng SAPP " + suffix, 10.76, 106.66, 150, chtUser, revObm);

        long crit1 = createCriterion(createCriterionGroup("GAPP1-" + suffix), "CAPP1-" + suffix, 3);
        long crit2 = createCriterion(createCriterionGroup("GAPP2-" + suffix), "CAPP2-" + suffix, 4);
        long templateId = createTemplate("TPAPP-" + suffix, List.of(crit1, crit2));

        long insId = createApprovedPlanWithAssignment(storeId, inspector, templateId, TODAY);

        // Checkin & chấm FAIL cả 2 tiêu chí
        mvc.perform(withJson(post("/api/v1/inspections/" + insId + "/checkin"), new InspectionCheckinRequest(10.76, 106.66))
                .with(as(inspector, QC_PERMS))).andExpect(status().isOk());
        mvc.perform(withJson(post("/api/v1/inspections/" + insId + "/submit"), new InspectionSubmitRequest(List.of(
                        new InspectionSubmitItemRequest(crit1, ItemResult.FAIL, "Lỗi 1", evidenceKey(inspector)),
                        new InspectionSubmitItemRequest(crit2, ItemResult.FAIL, "Lỗi 2", evidenceKey(inspector))), null))
                .with(as(inspector, QC_PERMS))).andExpect(status().isOk());

        String findingsJson = mvc.perform(get("/api/v1/findings").param("inspectionId", String.valueOf(insId))
                .with(as(inspector, QC_PERMS))).andReturn().getResponse().getContentAsString();
        long f1 = -1;
        long f2 = -1;
        for (tools.jackson.databind.JsonNode item : jsonMapper.readTree(findingsJson).get("items")) {
            if (item.get("criterionId").asLong() == crit1) {
                f1 = item.get("id").asLong();
            } else if (item.get("criterionId").asLong() == crit2) {
                f2 = item.get("id").asLong();
            }
        }
        assertThat(f1).isPositive();
        assertThat(f2).isPositive();

        // 1. Kiểm tra danh sách ứng viên thẩm định: không có người chấm, có KSVH và OBM
        String candidatesJson = mvc.perform(get("/api/v1/findings/" + f1 + "/candidate-reviewers")
                .with(as(chtUser, STORE_PERMS))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        List<Long> candIds = new ArrayList<>();
        jsonMapper.readTree(candidatesJson).forEach(n -> candIds.add(n.get("id").asLong()));
        assertThat(candIds).contains(revLead, revManager, revObm);
        assertThat(candIds).doesNotContain(inspector, otherUser);

        // 2. Các ca lỗi khi gửi khiếu nại
        // 2.1 Ít hơn 2 người
        mvc.perform(withJson(post("/api/v1/findings/" + f1 + "/appeal"),
                new FindingAppealRequest("Lý do", null, List.of(revLead))).with(as(chtUser, STORE_PERMS)))
                .andExpect(status().isBadRequest());
        // 2.2 Trùng người
        mvc.perform(withJson(post("/api/v1/findings/" + f1 + "/appeal"),
                new FindingAppealRequest("Lý do", null, List.of(revLead, revLead))).with(as(chtUser, STORE_PERMS)))
                .andExpect(status().isBadRequest());
        // 2.3 Chọn người đã chấm lỗi
        mvc.perform(withJson(post("/api/v1/findings/" + f1 + "/appeal"),
                new FindingAppealRequest("Lý do", null, List.of(revLead, inspector))).with(as(chtUser, STORE_PERMS)))
                .andExpect(status().isBadRequest());

        // 3. Ca đồng thuận UPHELD (giữ lỗi -> CONFIRMED, +1 tần suất) trên f1
        mvc.perform(withJson(post("/api/v1/findings/" + f1 + "/appeal"),
                new FindingAppealRequest("Khiếu nại f1", null, List.of(revLead, revManager))).with(as(chtUser, STORE_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(FindingStatus.APPEALED.name()));

        // Kiểm tra danh sách pending-reviews của revLead có f1
        String pendingJson = mvc.perform(get("/api/v1/findings/pending-reviews")
                .with(as(revLead, QA_PERMS))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        List<Long> pendingIds = new ArrayList<>();
        jsonMapper.readTree(pendingJson).forEach(n -> pendingIds.add(n.get("id").asLong()));
        assertThat(pendingIds).contains(f1);

        // Người ngoài danh sách thẩm định gửi review -> 403
        mvc.perform(withJson(post("/api/v1/findings/" + f1 + "/appeal-reviews"),
                new AppealReviewRequest(AppealVerdict.FINDING_VALID, "Ý kiến người ngoài"))
                .with(as(revObm, QA_PERMS))).andExpect(status().isForbidden());

        // revLead vote VALID
        mvc.perform(withJson(post("/api/v1/findings/" + f1 + "/appeal-reviews"),
                new AppealReviewRequest(AppealVerdict.FINDING_VALID, "Lỗi đúng 100%"))
                .with(as(revLead, QA_PERMS))).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(FindingStatus.APPEALED.name()));

        // revManager vote VALID -> Đồng thuận giữ lỗi
        mvc.perform(withJson(post("/api/v1/findings/" + f1 + "/appeal-reviews"),
                new AppealReviewRequest(AppealVerdict.FINDING_VALID, "Đồng ý giữ lỗi"))
                .with(as(revManager, QA_PERMS))).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(FindingStatus.CONFIRMED.name()))
                .andExpect(jsonPath("$.appealConclusion").value(AppealConclusion.UPHELD.name()));

        assertThat(jdbc.queryForObject("SELECT count(*) FROM finding_occurrences WHERE finding_id = ? AND source = 'APPEAL_UPHELD'",
                Integer.class, f1)).isEqualTo(1);
        LocalDate f1Deadline = jdbc.queryForObject("SELECT deadline_date FROM findings WHERE id = ?", LocalDate.class, f1);
        assertThat(f1Deadline).isAfterOrEqualTo(LocalDate.now());

        // 4. Ca đồng thuận DISMISSED (bỏ lỗi -> DISMISSED, không +1) trên f2
        mvc.perform(withJson(post("/api/v1/findings/" + f2 + "/appeal"),
                new FindingAppealRequest("Khiếu nại f2", null, List.of(revLead, revObm))).with(as(chtUser, STORE_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(FindingStatus.APPEALED.name()));

        mvc.perform(withJson(post("/api/v1/findings/" + f2 + "/appeal-reviews"),
                new AppealReviewRequest(AppealVerdict.FINDING_INVALID, "Lỗi ngoại cảnh, bỏ lỗi"))
                .with(as(revLead, QA_PERMS))).andExpect(status().isOk());

        mvc.perform(withJson(post("/api/v1/findings/" + f2 + "/appeal-reviews"),
                new AppealReviewRequest(AppealVerdict.FINDING_INVALID, "Đồng ý bỏ lỗi"))
                .with(as(revObm, QA_PERMS))).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(FindingStatus.DISMISSED.name()))
                .andExpect(jsonPath("$.appealConclusion").value(AppealConclusion.DISMISSED.name()));

        // Bỏ lỗi không tạo finding_occurrences
        assertThat(jdbc.queryForObject("SELECT count(*) FROM finding_occurrences WHERE finding_id = ?",
                Integer.class, f2)).isEqualTo(0);

        // Kết quả chấm gốc của Chuyên viên giữ nguyên là FAIL (bất biến), nhưng findingStatus hiển thị DISMISSED
        mvc.perform(get("/api/v1/inspections/" + insId + "/items").with(as(inspector, QC_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[1].result").value("FAIL"))
                .andExpect(jsonPath("$[1].findingStatus").value("DISMISSED"));
    }

    @Test
    void testStrictImmutabilityOfInspectionItemsAcrossEntirePostSubmitLifecycle() throws Exception {
        long inspector = insertUser("imm_insp", RoleCodes.KSVH_INSPECTOR);
        long chtUser = insertUser("imm_cht", RoleCodes.STORE_MANAGER);
        long revLead = insertUser("imm_lead", RoleCodes.KSVH_LEAD);
        long revManager = insertUser("imm_mgr", RoleCodes.KSVH_MANAGER);

        long compId = createCompany("IC-" + suffix);
        long storeId = createStore(compId, "IR-" + suffix, 10.7769, 106.7009, 150, chtUser);
        long groupId = createCriterionGroup("IG-" + suffix);
        long c1 = createCriterion(groupId, "IC1-" + suffix, 2);
        long c2 = createCriterion(groupId, "IC2-" + suffix, 3);
        long c3 = createCriterion(groupId, "IC3-" + suffix, 5);
        long tplId = createTemplate("IT-" + suffix, List.of(c1, c2, c3));

        long insId = createApprovedPlanWithAssignment(storeId, inspector, tplId, TODAY);
        mvc.perform(withJson(post("/api/v1/inspections/" + insId + "/checkin"),
                new InspectionCheckinRequest(10.7769, 106.7009)).with(as(inspector, QC_PERMS))).andExpect(status().isOk());

        // Chấm điểm và nộp phiếu
        String ev1 = evidenceKey(inspector);
        String ev2 = evidenceKey(inspector);
        List<InspectionSubmitItemRequest> submitItems = List.of(
                new InspectionSubmitItemRequest(c1, ItemResult.PASS, "Đạt chuẩn vệ sinh", null),
                new InspectionSubmitItemRequest(c2, ItemResult.FAIL, "Sàn bếp ẩm mốc", ev1),
                new InspectionSubmitItemRequest(c3, ItemResult.FAIL, "Thịt hết hạn 2 ngày", ev2)
        );
        mvc.perform(withJson(post("/api/v1/inspections/" + insId + "/submit"),
                new InspectionSubmitRequest(submitItems, "Ghi chú chấm")).with(as(inspector, QC_PERMS))).andExpect(status().isOk());

        // LƯU BASELINE SNAPSHOT trực tiếp từ bảng inspection_items ngay sau khi SUBMIT
        List<java.util.Map<String, Object>> baseline = jdbc.queryForList(
                "SELECT id, criterion_id, result, comment, evidence_urls FROM inspection_items WHERE inspection_id = ? ORDER BY id",
                insId
        );
        assertThat(baseline).hasSize(3);

        // Lấy danh sách findings
        List<Long> findingIds = jdbc.queryForList(
                "SELECT id FROM findings WHERE inspection_id = ? ORDER BY id",
                Long.class, insId
        );
        assertThat(findingIds).hasSize(2);
        long f1 = findingIds.get(0); // gắn với c2
        long f2 = findingIds.get(1); // gắn với c3

        // 1. Thao tác trên f1: CHT xác nhận trực tiếp -> lên kế hoạch -> gửi bằng chứng -> nghiệm thu ĐẠT (CLOSED)
        mvc.perform(post("/api/v1/findings/" + f1 + "/confirm").with(as(chtUser, STORE_PERMS))).andExpect(status().isOk());
        mvc.perform(withJson(post("/api/v1/findings/" + f1 + "/remediation-plan"),
                new FindingRemediationPlanRequest("Lau dọn sàn", TODAY)).with(as(chtUser, STORE_PERMS))).andExpect(status().isOk());
        String remEv = evidenceKey(chtUser);
        mvc.perform(withJson(post("/api/v1/findings/" + f1 + "/submit-remediation"),
                new FindingSubmitRemediationRequest(remEv)).with(as(chtUser, STORE_PERMS))).andExpect(status().isOk());
        mvc.perform(withJson(post("/api/v1/findings/" + f1 + "/verify"),
                new FindingVerifyRequest(true, "Nghiệm thu đạt")).with(as(inspector, PermissionCodes.INSPECTION_READ_OWN, PermissionCodes.FINDING_VERIFY))).andExpect(status().isOk());

        // 2. Thao tác trên f2: CHT khiếu nại -> Hội đồng đồng thuận BỎ LỖI (DISMISSED)
        mvc.perform(withJson(post("/api/v1/findings/" + f2 + "/appeal"),
                new FindingAppealRequest("Khiếu nại nhãn thịt", null, List.of(revLead, revManager))).with(as(chtUser, STORE_PERMS))).andExpect(status().isOk());
        mvc.perform(withJson(post("/api/v1/findings/" + f2 + "/appeal-reviews"),
                new AppealReviewRequest(AppealVerdict.FINDING_INVALID, "Bỏ lỗi")).with(as(revLead, QA_PERMS))).andExpect(status().isOk());
        mvc.perform(withJson(post("/api/v1/findings/" + f2 + "/appeal-reviews"),
                new AppealReviewRequest(AppealVerdict.FINDING_INVALID, "Đồng ý")).with(as(revManager, QA_PERMS))).andExpect(status().isOk());

        // KIỂM TRA BẤT BIẾN DỮ LIỆU: Toàn bộ bảng inspection_items phải y nguyên 100% so với baseline!
        List<java.util.Map<String, Object>> current = jdbc.queryForList(
                "SELECT id, criterion_id, result, comment, evidence_urls FROM inspection_items WHERE inspection_id = ? ORDER BY id",
                insId
        );
        assertThat(current).hasSize(3);
        for (int i = 0; i < 3; i++) {
            java.util.Map<String, Object> baseRow = baseline.get(i);
            java.util.Map<String, Object> currRow = current.get(i);
            assertThat(currRow.get("id")).isEqualTo(baseRow.get("id"));
            assertThat(currRow.get("criterion_id")).isEqualTo(baseRow.get("criterion_id"));
            assertThat(currRow.get("result")).isEqualTo(baseRow.get("result"));
            assertThat(currRow.get("comment")).isEqualTo(baseRow.get("comment"));
            assertThat(currRow.get("evidence_urls")).isEqualTo(baseRow.get("evidence_urls"));
        }

        // Kiểm tra qua API GET items: result gốc của mục bị bỏ lỗi vẫn là FAIL, chỉ findingStatus là DISMISSED
        mvc.perform(get("/api/v1/inspections/" + insId + "/items").with(as(inspector, QC_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].result").value("PASS"))
                .andExpect(jsonPath("$[1].result").value("FAIL"))
                .andExpect(jsonPath("$[2].result").value("FAIL"))
                .andExpect(jsonPath("$[2].findingStatus").value("DISMISSED"));
    }

    private long createApprovedPlanWithAssignment(long storeId, long inspectorId, long templateId, LocalDate date) throws Exception {
        String pCode = "PL-" + suffix + "-" + (System.nanoTime() % 100000);
        PlanCreateRequest req = new PlanCreateRequest(
                pCode, "Kế hoạch test " + pCode, date.minusDays(1), date.plusDays(7), null,
                List.of(new PlanAssignmentRequest(storeId, inspectorId, templateId, date))
        );
        String res = mvc.perform(withJson(post("/api/v1/inspection-plans"), req).with(as(1L, PLAN_PERMS)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long pId = extractId(res);
        mvc.perform(post("/api/v1/inspection-plans/" + pId + "/submit").with(as(1L, PLAN_PERMS))).andExpect(status().isOk());
        String appRes = mvc.perform(post("/api/v1/inspection-plans/" + pId + "/approve").with(as(2L, PLAN_PERMS)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return jsonMapper.readTree(appRes).get("assignments").get(0).get("inspectionId").asLong();
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

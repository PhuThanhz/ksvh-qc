package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.criteria.api.CriteriaLookupApi;
import vn.ksvh.qc.criteria.api.CriterionGroupRef;
import vn.ksvh.qc.criteria.api.CriterionRef;
import vn.ksvh.qc.criteria.api.TemplateRef;
import vn.ksvh.qc.inspection.domain.*;
import vn.ksvh.qc.inspection.dto.*;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.risk.RiskAssessment;
import vn.ksvh.qc.risk.RiskBand;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.NotFoundException;
import vn.ksvh.qc.shared.util.BusinessDates;
import vn.ksvh.qc.shared.util.GeoUtils;
import vn.ksvh.qc.shared.web.PageResponse;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InspectionService {

    private final InspectionRepository inspectionRepository;
    private final InspectionItemRepository itemRepository;
    private final FindingRepository findingRepository;
    private final FindingOccurrenceRepository occurrenceRepository;
    private final CriteriaLookupApi criteriaLookupApi;
    private final OrgUnitLookupApi orgUnitLookupApi;
    private final FindingEventRepository eventRepository;
    private final UserAccountApi userAccountApi;
    private final InspectionAccess access;
    private final RiskAssessor riskAssessor;
    private final Clock clock;

    public PageResponse<InspectionResponse> search(String keyword, Long restaurantId, Long inspectorId,
                                                  InspectionStatus status, Pageable pageable, CurrentUser user) {
        Specification<Inspection> spec = Specification.unrestricted();
        Specification<Inspection> scope = access.inspectionScope(user);
        if (scope != null) {
            spec = spec.and(scope);
        }
        if (StringUtils.hasText(keyword)) {
            String kw = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("code")), kw),
                    cb.like(cb.lower(root.get("inspectionType")), kw)
            ));
        }
        if (restaurantId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("restaurantId"), restaurantId));
        }
        if (inspectorId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("inspectorId"), inspectorId));
        }
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }

        var page = inspectionRepository.findAll(spec, pageable);

        var restaurantIds = page.getContent().stream().map(Inspection::getRestaurantId).distinct().toList();
        var inspectorIds = page.getContent().stream().map(Inspection::getInspectorId).distinct().toList();
        var templateIds = page.getContent().stream().map(Inspection::getTemplateId).distinct().toList();

        Map<Long, OrgUnitRef> restaurants = orgUnitLookupApi.findRefs(restaurantIds);
        Map<Long, UserSummary> inspectors = userAccountApi.findSummaries(inspectorIds);
        Map<Long, TemplateRef> templates = criteriaLookupApi.findTemplates(templateIds);

        return PageResponse.of(page, i -> {
            String rName = restaurants.containsKey(i.getRestaurantId()) ? restaurants.get(i.getRestaurantId()).name() : null;
            String tName = i.getTemplateId() != null && templates.containsKey(i.getTemplateId()) ? templates.get(i.getTemplateId()).name() : null;
            String insName = inspectors.containsKey(i.getInspectorId()) ? inspectors.get(i.getInspectorId()).fullName() : null;
            return InspectionResponse.from(i, rName, tName, insName, 0, null);
        });
    }

    public List<InspectionResponse> listMyInspections(Long inspectorId) {
        List<Inspection> list = inspectionRepository.findByInspectorIdAndStatusIn(
                inspectorId,
                List.of(InspectionStatus.ASSIGNED, InspectionStatus.IN_PROGRESS)
        );
        var restaurantIds = list.stream().map(Inspection::getRestaurantId).distinct().toList();
        var templateIds = list.stream().map(Inspection::getTemplateId).distinct().toList();

        Map<Long, OrgUnitRef> restaurants = orgUnitLookupApi.findRefs(restaurantIds);
        Map<Long, TemplateRef> templates = criteriaLookupApi.findTemplates(templateIds);
        Map<Long, UserSummary> inspectors = userAccountApi.findSummaries(List.of(inspectorId));
        String insName = inspectors.containsKey(inspectorId) ? inspectors.get(inspectorId).fullName() : null;

        return list.stream().map(i -> {
            String rName = restaurants.containsKey(i.getRestaurantId()) ? restaurants.get(i.getRestaurantId()).name() : null;
            String tName = i.getTemplateId() != null && templates.containsKey(i.getTemplateId()) ? templates.get(i.getTemplateId()).name() : null;
            return InspectionResponse.from(i, rName, tName, insName, 0, null);
        }).toList();
    }

    public InspectionResponse get(Long id, CurrentUser user) {
        Inspection i = load(id);
        access.requireRead(i, user);
        return toResponse(i);
    }

    private InspectionResponse toResponse(Inspection i) {
        Long id = i.getId();
        var rest = orgUnitLookupApi.findRefs(List.of(i.getRestaurantId())).get(i.getRestaurantId());
        var ins = userAccountApi.findSummaries(List.of(i.getInspectorId())).get(i.getInspectorId());
        var tpl = i.getTemplateId() == null ? null : criteriaLookupApi.findTemplate(i.getTemplateId()).orElse(null);
        Map<Long, CriterionGroupRef> topicGroups = criteriaLookupApi.findGroups(i.getTopicGroupIds());
        List<String> topicNames = i.getTopicGroupIds().stream().map(topicGroups::get).filter(Objects::nonNull).map(CriterionGroupRef::name).toList();

        List<Finding> findings = findingRepository.findByInspectionId(id);
        int totalRisk = findings.stream().mapToInt(Finding::getCalculatedScore).sum();
        String maxRisk = findings.stream()
                .map(Finding::getRiskLevelCode)
                .max(Comparator.naturalOrder())
                .orElse(null);

        return InspectionResponse.from(i,
                rest != null ? rest.name() : null,
                tpl != null ? tpl.name() : null,
                ins != null ? ins.fullName() : null,
                totalRisk,
                maxRisk,
                topicNames
        );
    }

    public List<InspectionItemResponse> listItems(Long id, CurrentUser user) {
        Inspection inspection = load(id);
        access.requireRead(inspection, user);
        return inspection.getItems().stream()
                .map(InspectionItemResponse::from)
                .toList();
    }

    @Transactional
    public InspectionResponse create(InspectionCreateRequest req, CurrentUser user) {
        String code = req.code().trim();
        if (inspectionRepository.existsByCodeIgnoreCase(code)) {
            throw codeTaken(code);
        }
        // Người không có quyền lập kế hoạch chỉ được tạo phiếu cho chính mình.
        if (!user.has(PermissionCodes.PLAN_CREATE) && !Objects.equals(req.inspectorId(), user.id())) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "Bạn chỉ được tạo phiếu chấm cho chính mình");
        }
        OrgUnitRef restaurant = orgUnitLookupApi.findRefs(List.of(req.restaurantId())).get(req.restaurantId());
        if (restaurant == null || !"RESTAURANT".equals(restaurant.unitType()) || !restaurant.active()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Nhà hàng không tồn tại hoặc đã ngừng hoạt động");
        }

        InspectionKind kind = req.inspectionType();
        InspectionMode mode = req.inspectionMode() != null ? req.inspectionMode() : InspectionMode.ON_SITE;
        List<CriterionRef> criteria;
        Long templateId = null;
        List<Long> topics = List.of();
        if (kind == InspectionKind.PERIODIC) {
            // Định kỳ tháng: thực tế tại nhà hàng, đủ mọi tiêu chí đang dùng của mẫu phiếu.
            if (mode != InspectionMode.ON_SITE) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Kiểm tra định kỳ tháng phải thực hiện thực tế tại nhà hàng");
            }
            if (req.templateId() == null) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Kiểm tra định kỳ phải chọn mẫu phiếu chấm");
            }
            TemplateRef template = criteriaLookupApi.findTemplate(req.templateId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy mẫu phiếu #" + req.templateId()));
            validateTemplateForRestaurant(template, restaurant);
            if (template.items().isEmpty()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Mẫu phiếu này không còn tiêu chí nào đang hoạt động");
            }
            templateId = template.id();
            criteria = template.items();
        } else {
            // Đột xuất: chỉ các tiêu chí thuộc chuyên đề (nhóm tiêu chí) được kích hoạt, không kiểm lại toàn bộ.
            topics = req.topicGroupIds() == null ? List.of() : req.topicGroupIds().stream().filter(Objects::nonNull).distinct().toList();
            if (topics.isEmpty()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Kiểm tra đột xuất phải chọn ít nhất một chuyên đề (nhóm tiêu chí)");
            }
            validateTopics(topics, restaurant);
            criteria = criteriaLookupApi.findActiveCriteriaInGroups(topics);
            if (criteria.isEmpty()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Các chuyên đề đã chọn chưa có tiêu chí nào đang hoạt động");
            }
        }

        Inspection inspection = new Inspection();
        inspection.setCode(code);
        inspection.setPlanId(req.planId());
        inspection.setRestaurantId(req.restaurantId());
        inspection.setTemplateId(templateId);
        inspection.setInspectorId(req.inspectorId());
        inspection.setInspectionType(kind);
        inspection.setInspectionMode(mode);
        inspection.getTopicGroupIds().addAll(topics);
        inspection.setNotes(StringUtils.hasText(req.notes()) ? req.notes().trim() : null);
        inspection.setStatus(InspectionStatus.ASSIGNED);
        inspection.setCreatedBy(user.id());

        int order = 1;
        for (CriterionRef c : criteria) {
            InspectionItem item = new InspectionItem();
            item.setInspection(inspection);
            item.setCriterionId(c.id());
            item.setCriterionCode(c.code());
            item.setCriterionName(c.name());
            item.setGroupName(c.groupName());
            item.setBaseImpact((short) c.baseImpact());
            item.setSortOrder(order++);
            item.setResult(ItemResult.UNRATED);
            inspection.getItems().add(item);
        }

        try {
            return toResponse(inspectionRepository.saveAndFlush(inspection));
        } catch (DataIntegrityViolationException e) {
            throw codeTaken(code); // hai người tạo cùng mã cùng lúc: unique index chặn lại
        }
    }

    /** Mẫu phải đang hoạt động và là mẫu dùng chung hoặc của đúng công ty của nhà hàng. */
    private static void validateTemplateForRestaurant(TemplateRef template, OrgUnitRef restaurant) {
        if (!template.active()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Mẫu phiếu '%s' đã ngưng hoạt động".formatted(template.name()));
        }
        if (template.companyId() != null && !template.companyId().equals(restaurant.companyId())) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Mẫu phiếu '%s' thuộc công ty khác, không dùng được cho nhà hàng '%s'".formatted(template.name(), restaurant.name()));
        }
    }

    /** Chuyên đề phải tồn tại, đang hoạt động, là nhóm dùng chung hoặc của đúng công ty của nhà hàng. */
    private void validateTopics(List<Long> topics, OrgUnitRef restaurant) {
        Map<Long, CriterionGroupRef> groups = criteriaLookupApi.findGroups(topics);
        for (Long id : topics) {
            CriterionGroupRef g = groups.get(id);
            if (g == null || !g.active()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Chuyên đề #%d không tồn tại hoặc đã ngưng hoạt động".formatted(id));
            }
            if (g.companyId() != null && !g.companyId().equals(restaurant.companyId())) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Chuyên đề '%s' thuộc công ty khác, không dùng được cho nhà hàng '%s'".formatted(g.name(), restaurant.name()));
            }
        }
    }

    private static BusinessException codeTaken(String code) {
        return new BusinessException(ErrorCode.INSPECTION_CODE_TAKEN, "Mã phiếu chấm '%s' đã tồn tại".formatted(code));
    }

    @Transactional
    public InspectionResponse checkin(Long id, InspectionCheckinRequest req, CurrentUser user) {
        Inspection inspection = load(id);
        access.requireAssignedInspector(inspection, user);
        if (inspection.getStatus() != InspectionStatus.ASSIGNED) {
            throw new BusinessException(ErrorCode.INSPECTION_INVALID_STATE, "Phiếu này đã check-in hoặc đã kết thúc");
        }

        OrgUnitRef rest = orgUnitLookupApi.findRefs(List.of(inspection.getRestaurantId())).get(inspection.getRestaurantId());
        if (rest == null) {
            throw new NotFoundException("Không tìm thấy thông tin nhà hàng #" + inspection.getRestaurantId());
        }
        // Vị trí chỉ ghi nhận, không chặn (GPS chưa bắt buộc – chốt 16/11/2026). Server tự tính khoảng cách.
        boolean hasFix = req.latitude() != null && req.longitude() != null;
        if (hasFix) {
            inspection.setCheckinLat(req.latitude());
            inspection.setCheckinLng(req.longitude());
        }
        if (inspection.getInspectionMode() == InspectionMode.REMOTE) {
            inspection.setLocationStatus(LocationStatus.REMOTE);
        } else if (hasFix && rest.latitude() != null && rest.longitude() != null) {
            double distance = GeoUtils.distanceMeters(req.latitude(), req.longitude(), rest.latitude(), rest.longitude());
            inspection.setCheckinDistanceM(distance);
            inspection.setLocationStatus(rest.checkinRadiusM() == null ? LocationStatus.UNVERIFIED
                    : distance <= rest.checkinRadiusM() ? LocationStatus.VERIFIED : LocationStatus.OUTSIDE_RADIUS);
        } else {
            inspection.setLocationStatus(LocationStatus.UNVERIFIED);
        }
        inspection.setCheckinAt(clock.instant());
        inspection.setStatus(InspectionStatus.IN_PROGRESS);

        return toResponse(inspectionRepository.saveAndFlush(inspection));
    }

    @Transactional
    public InspectionResponse submit(Long id, InspectionSubmitRequest req, CurrentUser user) {
        Inspection inspection = load(id);
        access.requireAssignedInspector(inspection, user);
        if (inspection.getStatus() != InspectionStatus.IN_PROGRESS) {
            throw new BusinessException(ErrorCode.INSPECTION_INVALID_STATE,
                    "Phiếu chưa check-in GPS hoặc đã gửi, không thể gửi kết quả");
        }

        Map<Long, InspectionSubmitItemRequest> submitMap = validateSubmission(inspection, req);

        Instant now = clock.instant();
        LocalDate today = BusinessDates.today(clock);

        boolean hasFail = false;
        for (InspectionItem item : inspection.getItems()) {
            InspectionSubmitItemRequest sub = submitMap.get(item.getCriterionId());
            item.setResult(sub.result());
            item.setComment(trimToNull(sub.comment()));
            item.setEvidenceUrls(trimToNull(sub.evidenceUrls()));
            item.setEvaluatedAt(now);

            if (sub.result() != ItemResult.FAIL) {
                continue;
            }
            hasFail = true;

            // Tần suất, nâng mức, mức rủi ro theo cấu hình đang hiệu lực (DOMAIN_SPEC §6).
            RiskAssessment risk = riskAssessor.assessNew(inspection.getRestaurantId(), item.getCriterionId(), item.getBaseImpact(), today);
            RiskBand level = risk.band();

            Finding finding = new Finding();
            finding.setInspectionId(inspection.getId());
            finding.setInspectionItemId(item.getId());
            finding.setRestaurantId(inspection.getRestaurantId());
            finding.setCriterionId(item.getCriterionId());
            finding.setBaseImpact(item.getBaseImpact());
            finding.setEffectiveImpact((short) risk.effectiveImpact());
            finding.setViolationCount(risk.frequency());
            finding.setCalculatedScore(risk.score());
            finding.setRiskLevelCode(level.code());
            finding.setRiskLevelName(level.name());
            finding.setRemediationDays(level.remediationDays());
            finding.setDeadlineDate(today.plusDays(level.remediationDays()));
            finding.setStatus(FindingStatus.OPEN);
            finding.setDescription(item.getComment());
            finding.setEvidenceUrls(item.getEvidenceUrls());

            Finding saved = findingRepository.save(finding);
            eventRepository.save(new FindingEvent(saved.getId(), FindingEventAction.CREATED, null,
                    FindingStatus.OPEN, user.id(), null, now));
        }

        inspection.setSubmittedAt(now);
        if (StringUtils.hasText(req.notes())) {
            inspection.setNotes(req.notes().trim());
        }
        if (hasFail) {
            inspection.setStatus(InspectionStatus.SUBMITTED);
        } else {
            inspection.setStatus(InspectionStatus.COMPLETED);
            inspection.setCompletedAt(now);
        }

        return toResponse(inspectionRepository.saveAndFlush(inspection));
    }

    /** Kiểm tra toàn bộ trước khi ghi: đủ tiêu chí, không trùng, đủ mô tả/bằng chứng theo DOMAIN_SPEC bước 2. */
    private Map<Long, InspectionSubmitItemRequest> validateSubmission(Inspection inspection, InspectionSubmitRequest req) {
        Map<Long, InspectionItem> items = new HashMap<>();
        inspection.getItems().forEach(it -> items.put(it.getCriterionId(), it));

        Map<Long, InspectionSubmitItemRequest> submitMap = new HashMap<>();
        for (InspectionSubmitItemRequest sub : req.items()) {
            InspectionItem item = items.get(sub.criterionId());
            if (item == null) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Tiêu chí #%d không thuộc phiếu chấm này".formatted(sub.criterionId()));
            }
            if (submitMap.putIfAbsent(sub.criterionId(), sub) != null) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Tiêu chí '%s' bị gửi trùng".formatted(item.getCriterionName()));
            }
            if (sub.result() == ItemResult.UNRATED) {
                throw new BusinessException(ErrorCode.INSPECTION_INCOMPLETE,
                        "Tiêu chí '%s' chưa được chấm".formatted(item.getCriterionName()));
            }
            if (sub.result() == ItemResult.FAIL && !StringUtils.hasText(sub.comment())) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Tiêu chí '%s' không đạt bắt buộc phải ghi mô tả lỗi".formatted(item.getCriterionName()));
            }
            if (sub.result() == ItemResult.FAIL && !StringUtils.hasText(sub.evidenceUrls())) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Tiêu chí '%s' không đạt bắt buộc có ít nhất 1 ảnh/video bằng chứng".formatted(item.getCriterionName()));
            }
            if (sub.result() == ItemResult.NA && !StringUtils.hasText(sub.comment())) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Tiêu chí '%s' chọn N/A bắt buộc ghi lý do".formatted(item.getCriterionName()));
            }
        }

        List<String> missing = items.values().stream()
                .filter(it -> !submitMap.containsKey(it.getCriterionId()))
                .sorted(Comparator.comparingInt(InspectionItem::getSortOrder))
                .map(InspectionItem::getCriterionName)
                .toList();
        if (!missing.isEmpty()) {
            throw new BusinessException(ErrorCode.INSPECTION_INCOMPLETE,
                    "Còn %d tiêu chí chưa chấm: %s".formatted(missing.size(), String.join(", ", missing)));
        }
        return submitMap;
    }

    private static String trimToNull(String s) {
        return StringUtils.hasText(s) ? s.trim() : null;
    }

    @Transactional
    public InspectionResponse cancel(Long id, InspectionCancelRequest req, CurrentUser user) {
        Inspection inspection = load(id);
        // Phiếu đã gửi là bất biến (quy tắc 4): lỗi đã sinh ra phải đi hết quy trình, không huỷ ngang.
        if (inspection.getStatus() != InspectionStatus.ASSIGNED && inspection.getStatus() != InspectionStatus.IN_PROGRESS) {
            throw new BusinessException(ErrorCode.INSPECTION_INVALID_STATE, "Chỉ huỷ được phiếu chưa gửi kết quả");
        }
        inspection.setStatus(InspectionStatus.CANCELLED);
        inspection.setCancelReason(req.reason().trim());
        return toResponse(inspectionRepository.saveAndFlush(inspection));
    }

    private Inspection load(Long id) {
        return inspectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu chấm #" + id));
    }
}

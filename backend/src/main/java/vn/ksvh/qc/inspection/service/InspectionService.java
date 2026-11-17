package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
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
import vn.ksvh.qc.inspection.api.event.FindingM4AlertEvent;
import vn.ksvh.qc.inspection.api.event.InspectionAssignedEvent;
import vn.ksvh.qc.inspection.api.event.InspectionSubmittedEvent;
import vn.ksvh.qc.inspection.domain.*;
import vn.ksvh.qc.inspection.dto.*;
import vn.ksvh.qc.media.api.EvidenceApi;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.risk.RiskAssessment;
import vn.ksvh.qc.risk.RiskBand;
import vn.ksvh.qc.risk.RiskRules;
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
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InspectionService {

    private final InspectionRepository inspectionRepository;
    private final InspectionItemRepository itemRepository;
    private final InspectionPlanRepository planRepository;
    private final FindingRepository findingRepository;
    private final FindingOccurrenceRepository occurrenceRepository;
    private final CriteriaLookupApi criteriaLookupApi;
    private final OrgUnitLookupApi orgUnitLookupApi;
    private final FindingEventRepository eventRepository;
    private final UserAccountApi userAccountApi;
    private final InspectionAccess access;
    private final EvidenceApi evidenceApi;
    private final RiskAssessor riskAssessor;
    private final FindingService findingService;
    private final Clock clock;
    private final ApplicationEventPublisher eventPublisher;

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
        var inspectionIds = page.getContent().stream().map(Inspection::getId).toList();
        var allTopicGroupIds = page.getContent().stream()
                .flatMap(ins -> ins.getTopicGroupIds().stream())
                .distinct()
                .toList();

        Map<Long, OrgUnitRef> restaurants = orgUnitLookupApi.findRefs(restaurantIds);
        Map<Long, UserSummary> inspectors = userAccountApi.findSummaries(inspectorIds);
        Map<Long, TemplateRef> templates = criteriaLookupApi.findTemplates(templateIds);
        Map<Long, CriterionGroupRef> topicGroups = criteriaLookupApi.findGroups(allTopicGroupIds);

        Map<Long, Integer> riskScoreMap = new HashMap<>();
        Map<Long, String> maxRiskMap = new HashMap<>();
        if (!inspectionIds.isEmpty()) {
            for (Object[] row : findingRepository.findRiskSummariesByInspectionIds(inspectionIds)) {
                Long insId = ((Number) row[0]).longValue();
                int sumScore = ((Number) row[1]).intValue();
                String maxCode = (String) row[2];
                riskScoreMap.put(insId, sumScore);
                maxRiskMap.put(insId, maxCode);
            }
        }

        return PageResponse.of(page, i -> {
            String rName = restaurants.containsKey(i.getRestaurantId()) ? restaurants.get(i.getRestaurantId()).name() : null;
            String tName = i.getTemplateId() != null && templates.containsKey(i.getTemplateId()) ? templates.get(i.getTemplateId()).name() : null;
            String insName = inspectors.containsKey(i.getInspectorId()) ? inspectors.get(i.getInspectorId()).fullName() : null;
            int totalRisk = riskScoreMap.getOrDefault(i.getId(), 0);
            String maxRisk = maxRiskMap.get(i.getId());
            List<String> tNames = i.getTopicGroupIds().stream()
                    .map(topicGroups::get)
                    .filter(Objects::nonNull)
                    .map(CriterionGroupRef::name)
                    .toList();
            return InspectionResponse.from(i, rName, tName, insName, totalRisk, maxRisk, tNames, false);
        });
    }

    public List<InspectionResponse> listMyInspections(Long inspectorId) {
        List<Inspection> list = inspectionRepository.findByInspectorIdAndStatusIn(
                inspectorId,
                List.of(InspectionStatus.ASSIGNED, InspectionStatus.IN_PROGRESS)
        );
        var restaurantIds = list.stream().map(Inspection::getRestaurantId).distinct().toList();
        var templateIds = list.stream().map(Inspection::getTemplateId).distinct().toList();
        var allTopicGroupIds = list.stream()
                .flatMap(ins -> ins.getTopicGroupIds().stream())
                .distinct()
                .toList();

        Map<Long, OrgUnitRef> restaurants = orgUnitLookupApi.findRefs(restaurantIds);
        Map<Long, TemplateRef> templates = criteriaLookupApi.findTemplates(templateIds);
        Map<Long, UserSummary> inspectors = userAccountApi.findSummaries(List.of(inspectorId));
        Map<Long, CriterionGroupRef> topicGroups = criteriaLookupApi.findGroups(allTopicGroupIds);
        String insName = inspectors.containsKey(inspectorId) ? inspectors.get(inspectorId).fullName() : null;

        return list.stream().map(i -> {
            String rName = restaurants.containsKey(i.getRestaurantId()) ? restaurants.get(i.getRestaurantId()).name() : null;
            String tName = i.getTemplateId() != null && templates.containsKey(i.getTemplateId()) ? templates.get(i.getTemplateId()).name() : null;
            List<String> tNames = i.getTopicGroupIds().stream()
                    .map(topicGroups::get)
                    .filter(Objects::nonNull)
                    .map(CriterionGroupRef::name)
                    .toList();
            return InspectionResponse.from(i, rName, tName, insName, 0, null, tNames, false);
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

        List<Finding> findings = findingRepository.findByInspectionId(id).stream()
                .filter(f -> f.getStatus() != FindingStatus.DISMISSED)
                .toList();
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
        List<Long> findingIds = inspection.getItems().stream()
                .map(InspectionItem::getFindingId)
                .filter(Objects::nonNull)
                .toList();
        Map<Long, Finding> findingMap = findingIds.isEmpty() ? Map.of()
                : findingRepository.findAllById(findingIds).stream()
                .collect(Collectors.toMap(Finding::getId, Function.identity()));
        return inspection.getItems().stream()
                .map(item -> InspectionItemResponse.from(item, item.getFindingId() != null ? findingMap.get(item.getFindingId()) : null))
                .toList();
    }

    @Transactional
    public InspectionResponse create(InspectionCreateRequest req, CurrentUser user) {
        // Người không có quyền lập kế hoạch chỉ được tạo phiếu cho chính mình.
        if (!user.has(PermissionCodes.PLAN_CREATE) && !Objects.equals(req.inspectorId(), user.id())) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "Bạn chỉ được tạo phiếu chấm cho chính mình");
        }
        return createChecked(req, user.id());
    }

    /**
     * Tạo phiếu cho một dòng phân công của kế hoạch vừa duyệt (PDF s.9). Mã phiếu theo mẫu PDF
     * {@code PER-<yyMM>-<mã nhà hàng>-<stt>}; kiểm tra nhà hàng / mẫu phiếu y như tạo tay.
     */
    @Transactional
    public InspectionResponse createFromPlanAssignment(InspectionPlan plan, PlanAssignment a, String restaurantCode, Long actorId) {
        String prefix = "PER-%s-%s-".formatted(a.getScheduledDate().format(java.time.format.DateTimeFormatter.ofPattern("yyMM")),
                restaurantCode.toUpperCase(java.util.Locale.ROOT));
        String code = null;
        for (int n = 1; n < 100; n++) {
            String candidate = prefix + "%02d".formatted(n);
            if (!inspectionRepository.existsByCodeIgnoreCase(candidate)) {
                code = candidate;
                break;
            }
        }
        if (code == null || code.length() > 30) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Không sinh được mã phiếu cho nhà hàng '%s' (mã quá dài hoặc đã đủ 99 phiếu trong tháng)".formatted(restaurantCode));
        }
        InspectionCreateRequest req = new InspectionCreateRequest(code, plan.getId(), a.getRestaurantId(), a.getTemplateId(),
                a.getInspectorId(), InspectionKind.PERIODIC, InspectionMode.ON_SITE, null,
                "Theo kế hoạch %s, ngày dự kiến %s".formatted(plan.getPlanCode(), a.getScheduledDate()));
        return createChecked(req, actorId);
    }

    /** Kiểm tra nghiệp vụ và tạo phiếu (dùng chung cho tạo tay và tạo khi duyệt kế hoạch). */
    private InspectionResponse createChecked(InspectionCreateRequest req, Long actorId) {
        String code = req.code().trim();
        if (inspectionRepository.existsByCodeIgnoreCase(code)) {
            throw codeTaken(code);
        }
        requirePlanForPeriodic(req.inspectionType(), req.planId());
        if (req.planId() != null) {
            InspectionPlan plan = planRepository.findById(req.planId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy kế hoạch #" + req.planId()));
            if (plan.getStatus() != PlanStatus.APPROVED) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Kế hoạch '%s' chưa được phê duyệt (trạng thái: %s)".formatted(plan.getTitle(), plan.getStatus()));
            }
        }
        OrgUnitRef restaurant = orgUnitLookupApi.findRefs(List.of(req.restaurantId())).get(req.restaurantId());
        if (restaurant == null || !"RESTAURANT".equals(restaurant.unitType()) || !restaurant.active()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Nhà hàng không tồn tại hoặc đã ngừng hoạt động");
        }

        InspectionKind kind = req.inspectionType();
        InspectionMode mode = req.inspectionMode() != null ? req.inspectionMode() : InspectionMode.ON_SITE;
        List<CriterionRef> criteria = List.of();
        Long templateId = null;
        List<Long> topics = List.of();
        List<Finding> verificationFindings = List.of();

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
        } else if (kind == InspectionKind.SURPRISE) {
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
        } else if (kind == InspectionKind.VERIFICATION) {
            // Kiểm tra kết quả khắc phục: gom các lỗi chờ nghiệm thu vào một phiếu
            if (req.findingIds() != null && !req.findingIds().isEmpty()) {
                verificationFindings = findingRepository.findAllById(req.findingIds());
                if (verificationFindings.size() != req.findingIds().size()) {
                    throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Một số lỗi được chọn không tồn tại");
                }
                for (Finding f : verificationFindings) {
                    if (!Objects.equals(f.getRestaurantId(), req.restaurantId())) {
                        throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Lỗi #" + f.getId() + " không thuộc nhà hàng đã chọn");
                    }
                    if (f.getStatus() != FindingStatus.PENDING_VERIFICATION && f.getStatus() != FindingStatus.REMEDIATING) {
                        throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                                "Lỗi #" + f.getId() + " đang ở trạng thái " + f.getStatus() + ", không thể nghiệm thu");
                    }
                }
            } else {
                verificationFindings = findingRepository.findByRestaurantIdAndStatusIn(
                        req.restaurantId(),
                        List.of(FindingStatus.PENDING_VERIFICATION, FindingStatus.REMEDIATING)
                );
                if (verificationFindings.isEmpty()) {
                    throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                            "Nhà hàng này hiện không có lỗi nào đang chờ nghiệm thu kết quả khắc phục");
                }
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
        inspection.setCreatedBy(actorId);

        int order = 1;
        if (kind == InspectionKind.VERIFICATION) {
            var critIds = verificationFindings.stream().map(Finding::getCriterionId).distinct().toList();
            Map<Long, CriterionRef> critMap = criteriaLookupApi.findCriteria(critIds);
            for (Finding f : verificationFindings) {
                CriterionRef c = critMap.get(f.getCriterionId());
                InspectionItem item = new InspectionItem();
                item.setInspection(inspection);
                item.setFindingId(f.getId());
                item.setCriterionId(f.getCriterionId());
                item.setCriterionCode(c != null ? c.code() : ("C" + f.getCriterionId()));
                item.setCriterionName(c != null ? c.name() : ("Tiêu chí #" + f.getCriterionId()));
                item.setGroupName(c != null ? c.groupName() : null);
                item.setBaseImpact(f.getEffectiveImpact());
                item.setSortOrder(order++);
                item.setResult(ItemResult.UNRATED);
                inspection.getItems().add(item);
            }
        } else {
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
        }

        try {
            InspectionResponse res = toResponse(inspectionRepository.saveAndFlush(inspection));
            eventPublisher.publishEvent(new InspectionAssignedEvent(
                    res.id(), res.code(), res.restaurantId(), res.restaurantName(), res.inspectorId(), res.inspectionType().name()
            ));
            return res;
        } catch (DataIntegrityViolationException e) {
            throw codeTaken(code); // hai người tạo cùng mã cùng lúc: unique index chặn lại
        }
    }

    @Transactional
    public List<InspectionResponse> createBatch(InspectionBatchCreateRequest req, CurrentUser user) {
        if (!user.has(PermissionCodes.PLAN_CREATE) && !Objects.equals(req.inspectorId(), user.id())) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "Bạn chỉ được tạo phiếu chấm cho chính mình");
        }
        if (req.inspectionType() == InspectionKind.VERIFICATION) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Phiếu kiểm tra kết quả khắc phục chỉ được tạo đơn lẻ cho từng nhà hàng");
        }
        requirePlanForPeriodic(req.inspectionType(), req.planId());
        if (req.planId() != null) {
            InspectionPlan plan = planRepository.findById(req.planId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy kế hoạch #" + req.planId()));
            if (plan.getStatus() != PlanStatus.APPROVED) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Kế hoạch '%s' chưa được phê duyệt (trạng thái: %s)".formatted(plan.getTitle(), plan.getStatus()));
            }
        }
        List<Long> restaurantIds = req.restaurantIds().stream().filter(Objects::nonNull).distinct().toList();
        if (restaurantIds.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Vui lòng chọn ít nhất một nhà hàng");
        }

        Map<Long, OrgUnitRef> restaurants = orgUnitLookupApi.findRefs(restaurantIds);
        for (Long rId : restaurantIds) {
            OrgUnitRef r = restaurants.get(rId);
            if (r == null || !"RESTAURANT".equals(r.unitType()) || !r.active()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Nhà hàng #" + rId + " không tồn tại hoặc đã ngừng hoạt động");
            }
        }

        InspectionKind kind = req.inspectionType();
        InspectionMode mode = req.inspectionMode() != null ? req.inspectionMode() : InspectionMode.ON_SITE;
        List<CriterionRef> criteria;
        Long templateId = null;
        List<Long> topics = List.of();

        if (kind == InspectionKind.PERIODIC) {
            if (mode != InspectionMode.ON_SITE) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Kiểm tra định kỳ tháng phải thực hiện thực tế tại nhà hàng");
            }
            if (req.templateId() == null) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Kiểm tra định kỳ phải chọn mẫu phiếu chấm");
            }
            TemplateRef template = criteriaLookupApi.findTemplate(req.templateId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy mẫu phiếu #" + req.templateId()));
            for (Long rId : restaurantIds) {
                validateTemplateForRestaurant(template, restaurants.get(rId));
            }
            if (template.items().isEmpty()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Mẫu phiếu này không còn tiêu chí nào đang hoạt động");
            }
            templateId = template.id();
            criteria = template.items();
        } else {
            topics = req.topicGroupIds() == null ? List.of() : req.topicGroupIds().stream().filter(Objects::nonNull).distinct().toList();
            if (topics.isEmpty()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Kiểm tra đột xuất phải chọn ít nhất một chuyên đề (nhóm tiêu chí)");
            }
            for (Long rId : restaurantIds) {
                validateTopics(topics, restaurants.get(rId));
            }
            criteria = criteriaLookupApi.findActiveCriteriaInGroups(topics);
            if (criteria.isEmpty()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Các chuyên đề đã chọn chưa có tiêu chí nào đang hoạt động");
            }
        }

        String prefix = req.codePrefix().trim().toUpperCase(Locale.ROOT);
        List<Inspection> createdList = new ArrayList<>();
        Set<String> allocatedCodes = new HashSet<>();

        for (Long rId : restaurantIds) {
            OrgUnitRef rest = restaurants.get(rId);
            String storeCode = StringUtils.hasText(rest.code()) ? rest.code().trim().toUpperCase(Locale.ROOT) : ("R" + rest.id());
            String candidateCode = prefix + "-" + storeCode;
            int suffix = 1;
            while (allocatedCodes.contains(candidateCode) || inspectionRepository.existsByCodeIgnoreCase(candidateCode)) {
                candidateCode = prefix + "-" + storeCode + "-" + suffix++;
            }
            allocatedCodes.add(candidateCode);

            Inspection inspection = new Inspection();
            inspection.setCode(candidateCode);
            inspection.setPlanId(req.planId());
            inspection.setRestaurantId(rId);
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
            createdList.add(inspection);
        }

        try {
            inspectionRepository.saveAllAndFlush(createdList);
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Lỗi trùng lặp mã phiếu hoặc dữ liệu không hợp lệ trong đợt tạo hàng loạt");
        }

        List<InspectionResponse> responses = createdList.stream().map(this::toResponse).toList();
        for (InspectionResponse res : responses) {
            eventPublisher.publishEvent(new InspectionAssignedEvent(
                    res.id(), res.code(), res.restaurantId(), res.restaurantName(), res.inspectorId(), res.inspectionType().name()
            ));
        }
        return responses;
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

    /** PDF s.9: phiếu định kỳ chỉ sinh từ kế hoạch đã được Quản lý KSVH duyệt. Đột xuất được tạo riêng. */
    private static void requirePlanForPeriodic(InspectionKind kind, Long planId) {
        if (kind == InspectionKind.PERIODIC && planId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Kiểm tra định kỳ phải thuộc một kế hoạch kiểm tra đã được phê duyệt");
        }
    }

    /** Dùng khi lưu phân công kế hoạch: mẫu phiếu phải đang dùng, đúng công ty và còn tiêu chí. */
    static void validateTemplateForAssignment(TemplateRef template, OrgUnitRef restaurant) {
        validateTemplateForRestaurant(template, restaurant);
        if (template.items().isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Mẫu phiếu '%s' không còn tiêu chí nào đang hoạt động".formatted(template.name()));
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

        if (inspection.getInspectionType() == InspectionKind.VERIFICATION) {
            return submitVerification(inspection, req, user);
        }

        Map<Long, InspectionSubmitItemRequest> submitMap = validateSubmission(inspection, req);
        // Ảnh bằng chứng: chỉ nhận key do server cấp, của chính chuyên viên, đã có trên kho (CLAUDE.md quy tắc 3).
        Map<Long, String> evidenceByCriterion = new HashMap<>();
        submitMap.forEach((criterionId, sub) -> {
            String keys = evidenceApi.requireUploaded(sub.evidenceUrls(), user.id());
            if (keys != null) {
                evidenceByCriterion.put(criterionId, keys);
            }
        });

        Instant now = clock.instant();
        LocalDate today = BusinessDates.today(clock);

        List<InspectionSubmitItemRequest> failedSubs = submitMap.values().stream()
                .filter(s -> s.result() == ItemResult.FAIL)
                .toList();
        boolean hasFail = !failedSubs.isEmpty();

        RiskRules rules = hasFail ? RiskRules.from(criteriaLookupApi.riskConfigAt(today)) : null;
        Map<Long, List<LocalDate>> occurrencesByCriterion = Map.of();
        if (hasFail) {
            List<Long> failedCritIds = failedSubs.stream().map(InspectionSubmitItemRequest::criterionId).distinct().toList();
            occurrencesByCriterion = occurrenceRepository.findByRestaurantIdAndCriterionIdIn(inspection.getRestaurantId(), failedCritIds).stream()
                    .collect(Collectors.groupingBy(
                            FindingOccurrence::getCriterionId,
                            Collectors.mapping(o -> o.getOccurredAt().atZone(BusinessDates.ZONE).toLocalDate(), Collectors.toList())
                    ));
        }

        List<FindingEvent> eventsToSave = new ArrayList<>();
        List<Finding> createdFindings = new ArrayList<>();
        Map<Long, String> criterionNamesByFindingId = new HashMap<>();
        for (InspectionItem item : inspection.getItems()) {
            InspectionSubmitItemRequest sub = submitMap.get(item.getCriterionId());
            item.setResult(sub.result());
            item.setComment(trimToNull(sub.comment()));
            item.setEvidenceUrls(evidenceByCriterion.get(item.getCriterionId()));
            item.setEvaluatedAt(now);

            if (sub.result() != ItemResult.FAIL) {
                continue;
            }

            // Tần suất, nâng mức, mức rủi ro theo cấu hình đang hiệu lực (DOMAIN_SPEC §6).
            List<LocalDate> previous = occurrencesByCriterion.getOrDefault(item.getCriterionId(), List.of());
            RiskAssessment risk = riskAssessor.assess(item.getBaseImpact(), previous, today, rules);
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
            createdFindings.add(saved);
            criterionNamesByFindingId.put(saved.getId(), item.getCriterionName());
            eventsToSave.add(new FindingEvent(saved.getId(), FindingEventAction.CREATED, null,
                    FindingStatus.OPEN, user.id(), null, now));
        }

        if (!eventsToSave.isEmpty()) {
            eventRepository.saveAll(eventsToSave);
        }

        inspection.setSubmittedAt(now);
        if (StringUtils.hasText(req.notes())) {
            inspection.setNotes(req.notes().trim());
        }
        if (hasFail) {
            inspection.setStatus(InspectionStatus.SUBMITTED);
        } else {
            // Không có lỗi: chờ CHT xác nhận đã xem (DOMAIN_SPEC §4 bước 3) rồi mới hoàn thành.
            inspection.setStatus(InspectionStatus.AWAITING_ACK);
        }

        InspectionResponse res = toResponse(inspectionRepository.saveAndFlush(inspection));
        eventPublisher.publishEvent(new InspectionSubmittedEvent(
                res.id(), res.code(), res.restaurantId(), res.restaurantName(), res.inspectorId(), failedSubs.size()
        ));
        for (Finding f : createdFindings) {
            if ("M4".equalsIgnoreCase(f.getRiskLevelCode())) {
                eventPublisher.publishEvent(new FindingM4AlertEvent(
                        f.getId(), res.id(), res.restaurantId(), res.restaurantName(),
                        criterionNamesByFindingId.getOrDefault(f.getId(), "Tiêu chí #" + f.getCriterionId()),
                        f.getCalculatedScore()
                ));
            }
        }
        return res;
    }

    private InspectionResponse submitVerification(Inspection inspection, InspectionSubmitRequest req, CurrentUser user) {
        Map<Long, InspectionSubmitItemRequest> submitByItem = new HashMap<>();
        Map<Long, InspectionSubmitItemRequest> submitByCriterion = new HashMap<>();
        for (InspectionSubmitItemRequest sub : req.items()) {
            if (sub.itemId() != null) {
                submitByItem.put(sub.itemId(), sub);
            }
            submitByCriterion.put(sub.criterionId(), sub);
        }

        Instant now = clock.instant();
        int failedCount = 0;

        for (InspectionItem item : inspection.getItems()) {
            InspectionSubmitItemRequest sub = submitByItem.get(item.getId());
            if (sub == null) {
                sub = submitByCriterion.get(item.getCriterionId());
            }
            if (sub == null) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Thiếu kết quả nghiệm thu cho tiêu chí '" + item.getCriterionName() + "'");
            }
            if (sub.result() != ItemResult.PASS && sub.result() != ItemResult.FAIL) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Kết quả nghiệm thu phải là Đạt (PASS) hoặc Không đạt (FAIL)");
            }

            String evidence = evidenceApi.requireUploaded(sub.evidenceUrls(), user.id());
            item.setResult(sub.result());
            item.setComment(trimToNull(sub.comment()));
            item.setEvidenceUrls(evidence);
            item.setEvaluatedAt(now);

            boolean passed = sub.result() == ItemResult.PASS;
            if (!passed) {
                failedCount++;
            }

            if (item.getFindingId() != null) {
                Finding f = findingRepository.findById(item.getFindingId()).orElse(null);
                if (f != null) {
                    findingService.verifyInternal(f, passed, item.getComment(), user.id(), user.username());
                }
            }
        }

        inspection.setSubmittedAt(now);
        inspection.setCompletedAt(now);
        inspection.setStatus(InspectionStatus.COMPLETED);
        if (StringUtils.hasText(req.notes())) {
            inspection.setNotes(req.notes().trim());
        }

        InspectionResponse res = toResponse(inspectionRepository.saveAndFlush(inspection));
        eventPublisher.publishEvent(new InspectionSubmittedEvent(
                res.id(), res.code(), res.restaurantId(), res.restaurantName(), res.inspectorId(), failedCount
        ));
        return res;
    }

    /** CHT của nhà hàng xác nhận đã xem phiếu không có lỗi → phiếu hoàn thành. */
    @Transactional
    public InspectionResponse acknowledge(Long id, CurrentUser user) {
        Inspection inspection = load(id);
        access.requireStoreManager(inspection.getRestaurantId(), user);
        if (inspection.getStatus() != InspectionStatus.AWAITING_ACK) {
            throw new BusinessException(ErrorCode.INSPECTION_INVALID_STATE,
                    "Chỉ xác nhận đã xem được phiếu không có lỗi đang chờ Cửa hàng trưởng xác nhận");
        }
        Instant now = clock.instant();
        inspection.setAcknowledgedBy(user.id());
        inspection.setAcknowledgedAt(now);
        inspection.setStatus(InspectionStatus.COMPLETED);
        inspection.setCompletedAt(now);
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
        Inspection saved = inspectionRepository.saveAndFlush(inspection);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                    user != null ? user.id() : null,
                    user != null ? user.username() : null,
                    null,
                    "INSPECTION_CANCEL",
                    "INSPECTION",
                    saved.getCode(),
                    "Huỷ phiếu kiểm tra " + saved.getCode() + ": " + req.reason().trim(),
                    req.reason().trim()
            ));
        }
        return toResponse(saved);
    }

    private Inspection load(Long id) {
        return inspectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu chấm #" + id));
    }
}

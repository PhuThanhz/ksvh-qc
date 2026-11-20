package vn.ksvh.qc.inspection.service;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.criteria.api.CriteriaLookupApi;
import vn.ksvh.qc.criteria.api.CriterionGroupRef;
import vn.ksvh.qc.criteria.api.CriterionRef;
import vn.ksvh.qc.criteria.api.TemplateRef;
import vn.ksvh.qc.inspection.api.event.InspectionAssignedEvent;
import vn.ksvh.qc.inspection.config.InspectionProperties;
import vn.ksvh.qc.inspection.domain.*;
import vn.ksvh.qc.inspection.dto.InspectionBatchCreateRequest;
import vn.ksvh.qc.inspection.dto.InspectionCreateRequest;
import vn.ksvh.qc.inspection.dto.InspectionResponse;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.NotFoundException;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class InspectionCreationService {

    private final InspectionRepository inspectionRepository;
    private final InspectionPlanRepository planRepository;
    private final FindingRepository findingRepository;
    private final CriteriaLookupApi criteriaLookupApi;
    private final OrgUnitLookupApi orgUnitLookupApi;
    private final InspectionQueryService queryService;
    private final ApplicationEventPublisher eventPublisher;
    private final InspectionProperties properties;
    private final InspectionBatchCreationService batchCreationService;

    public InspectionCreationService(
            InspectionRepository inspectionRepository,
            InspectionPlanRepository planRepository,
            FindingRepository findingRepository,
            CriteriaLookupApi criteriaLookupApi,
            OrgUnitLookupApi orgUnitLookupApi,
            InspectionQueryService queryService,
            ApplicationEventPublisher eventPublisher,
            InspectionProperties properties,
            @Lazy InspectionBatchCreationService batchCreationService
    ) {
        this.inspectionRepository = inspectionRepository;
        this.planRepository = planRepository;
        this.findingRepository = findingRepository;
        this.criteriaLookupApi = criteriaLookupApi;
        this.orgUnitLookupApi = orgUnitLookupApi;
        this.queryService = queryService;
        this.eventPublisher = eventPublisher;
        this.properties = properties;
        this.batchCreationService = batchCreationService;
    }

    @Transactional
    public InspectionResponse create(InspectionCreateRequest req, CurrentUser user) {
        if (!user.has(PermissionCodes.PLAN_CREATE) && !Objects.equals(req.inspectorId(), user.id())) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "Bạn chỉ được tạo phiếu chấm cho chính mình");
        }
        return createChecked(req, user.id());
    }

    @Transactional
    public InspectionResponse createFromPlanAssignment(InspectionPlan plan, PlanAssignment a, String restaurantCode, Long actorId) {
        boolean surprise = plan.getInspectionKind() == InspectionKind.SURPRISE;
        String prefix = "%s-%s-%s-".formatted(surprise ? "DX" : "PER",
                // Mã phiếu theo tháng của ngày kiểm tra (kế hoạch cũ) hoặc của hạn hoàn thành kế hoạch
                (a.getScheduledDate() != null ? a.getScheduledDate() : plan.getEndDate()).format(java.time.format.DateTimeFormatter.ofPattern("yyMM")),
                restaurantCode.toUpperCase(java.util.Locale.ROOT));
        String code = null;
        int maxInspections = properties.maxInspectionsPerMonth();
        for (int n = 1; n <= maxInspections; n++) {
            String candidate = prefix + "%02d".formatted(n);
            if (!inspectionRepository.existsByCodeIgnoreCase(candidate)) {
                code = candidate;
                break;
            }
        }
        if (code == null || code.length() > 30) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Không sinh được mã phiếu cho nhà hàng '%s' (mã quá dài hoặc đã đủ %d phiếu trong tháng)".formatted(restaurantCode, maxInspections));
        }
        InspectionCreateRequest req = new InspectionCreateRequest(code, plan.getId(), a.getRestaurantId(),
                surprise ? null : a.getTemplateId(), a.getInspectorId(),
                surprise ? InspectionKind.SURPRISE : InspectionKind.PERIODIC, InspectionMode.ON_SITE,
                surprise ? List.copyOf(a.getTopicGroupIds()) : null,
                a.getScheduledDate() != null
                        ? "Theo kế hoạch %s, ngày dự kiến %s".formatted(plan.getPlanCode(), a.getScheduledDate())
                        : "Theo kế hoạch %s, hạn hoàn thành %s".formatted(plan.getPlanCode(),
                                plan.getEndDate().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))),
                List.of(),
                // Đột xuất có tick tiêu chí → phiếu chỉ gồm các tiêu chí đó; rỗng → toàn bộ tiêu chí của chuyên đề
                surprise ? List.copyOf(a.getCriterionIds()) : List.of());
        return createChecked(req, actorId);
    }

    @Transactional
    public InspectionResponse createChecked(InspectionCreateRequest req, Long actorId) {
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
            topics = req.topicGroupIds() == null ? List.of() : req.topicGroupIds().stream().filter(Objects::nonNull).distinct().toList();
            List<Long> critIds = req.criterionIds() == null ? List.of() : req.criterionIds().stream().filter(Objects::nonNull).distinct().toList();
            if (topics.isEmpty() && critIds.isEmpty()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Kiểm tra đột xuất phải chọn ít nhất một chuyên đề hoặc tiêu chí");
            }
            if (!critIds.isEmpty()) {
                Map<Long, CriterionRef> critMap = criteriaLookupApi.findCriteria(critIds);
                criteria = critIds.stream().map(critMap::get).filter(Objects::nonNull).filter(CriterionRef::active).toList();
                if (criteria.isEmpty()) {
                    throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Các tiêu chí đã chọn không tồn tại hoặc đã ngưng hoạt động");
                }
                if (topics.isEmpty()) {
                    topics = criteria.stream().map(CriterionRef::groupId).filter(Objects::nonNull).distinct().toList();
                }
            } else {
                validateTopics(topics, restaurant);
                criteria = criteriaLookupApi.findActiveCriteriaInGroups(topics);
                if (criteria.isEmpty()) {
                    throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Các chuyên đề đã chọn chưa có tiêu chí nào đang hoạt động");
                }
            }
        } else if (kind == InspectionKind.VERIFICATION) {
            verificationFindings = resolveVerificationFindings(req);
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

        if (kind == InspectionKind.VERIFICATION) {
            populateVerificationItems(inspection, verificationFindings);
        } else {
            populateCriteriaItems(inspection, criteria);
        }

        try {
            InspectionResponse res = queryService.toResponse(inspectionRepository.saveAndFlush(inspection));
            eventPublisher.publishEvent(new InspectionAssignedEvent(
                    res.id(), res.code(), res.restaurantId(), res.restaurantName(), res.inspectorId(), res.inspectionType().name()
            ));
            return res;
        } catch (DataIntegrityViolationException e) {
            throw codeTaken(code);
        }
    }

    @Transactional
    public List<InspectionResponse> createBatch(InspectionBatchCreateRequest req, CurrentUser user) {
        return batchCreationService.createBatch(req, user);
    }

    private List<Finding> resolveVerificationFindings(InspectionCreateRequest req) {
        if (req.findingIds() != null && !req.findingIds().isEmpty()) {
            List<Finding> list = findingRepository.findAllById(req.findingIds());
            if (list.size() != req.findingIds().size()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Một số lỗi được chọn không tồn tại");
            }
            for (Finding f : list) {
                if (!Objects.equals(f.getRestaurantId(), req.restaurantId())) {
                    throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Lỗi #" + f.getId() + " không thuộc nhà hàng đã chọn");
                }
                if (f.getStatus() != FindingStatus.PENDING_VERIFICATION) {
                    var crit = criteriaLookupApi.findCriteria(List.of(f.getCriterionId())).get(f.getCriterionId());
                    String critName = crit != null ? crit.name() : ("#" + f.getId());
                    throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                            "Lỗi '%s' chưa gửi bằng chứng khắc phục, chưa thể kiểm tra kết quả".formatted(critName));
                }
            }
            return list;
        }
        List<Finding> list = findingRepository.findByRestaurantIdAndStatusIn(
                req.restaurantId(),
                List.of(FindingStatus.PENDING_VERIFICATION)
        );
        if (list.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Nhà hàng này hiện không có lỗi nào đang chờ nghiệm thu kết quả khắc phục");
        }
        return list;
    }

    private void populateVerificationItems(Inspection inspection, List<Finding> findings) {
        var critIds = findings.stream().map(Finding::getCriterionId).distinct().toList();
        Map<Long, CriterionRef> critMap = criteriaLookupApi.findCriteria(critIds);
        int order = 1;
        for (Finding f : findings) {
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
    }

    private void populateCriteriaItems(Inspection inspection, List<CriterionRef> criteria) {
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
    }

    public static void validateTemplateForRestaurant(TemplateRef template, OrgUnitRef restaurant) {
        if (!template.active()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Mẫu phiếu '%s' đã ngưng hoạt động".formatted(template.name()));
        }
        if (template.companyId() != null && !template.companyId().equals(restaurant.companyId())) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Mẫu phiếu '%s' thuộc công ty khác, không dùng được cho nhà hàng '%s'".formatted(template.name(), restaurant.name()));
        }
    }

    public void validateTopics(List<Long> topics, OrgUnitRef restaurant) {
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

    public static void requirePlanForPeriodic(InspectionKind kind, Long planId) {
        if (kind == InspectionKind.PERIODIC && planId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Kiểm tra định kỳ phải thuộc một kế hoạch kiểm tra đã được phê duyệt");
        }
    }

    public static void validateTemplateForAssignment(TemplateRef template, OrgUnitRef restaurant) {
        validateTemplateForRestaurant(template, restaurant);
        if (template.items().isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Mẫu phiếu '%s' không còn tiêu chí nào đang hoạt động".formatted(template.name()));
        }
    }

    public static BusinessException codeTaken(String code) {
        return new BusinessException(ErrorCode.INSPECTION_CODE_TAKEN, "Mã phiếu chấm '%s' đã tồn tại".formatted(code));
    }
}

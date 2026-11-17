package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.criteria.api.CriteriaLookupApi;
import vn.ksvh.qc.criteria.api.TemplateRef;
import vn.ksvh.qc.inspection.api.event.PlanApprovedEvent;
import vn.ksvh.qc.inspection.api.event.PlanRejectedEvent;
import vn.ksvh.qc.inspection.api.event.PlanSubmittedEvent;
import vn.ksvh.qc.criteria.api.CriterionRef;
import vn.ksvh.qc.inspection.domain.Finding;
import vn.ksvh.qc.inspection.domain.FindingRepository;
import vn.ksvh.qc.inspection.domain.FindingStatus;
import vn.ksvh.qc.inspection.domain.Inspection;
import vn.ksvh.qc.inspection.domain.InspectionPlan;
import vn.ksvh.qc.inspection.domain.InspectionPlanRepository;
import vn.ksvh.qc.inspection.domain.InspectionRepository;
import vn.ksvh.qc.inspection.domain.PlanAssignment;
import vn.ksvh.qc.inspection.domain.PlanAssignmentRepository;
import vn.ksvh.qc.inspection.domain.PlanStatus;
import vn.ksvh.qc.inspection.dto.InspectionResponse;
import vn.ksvh.qc.inspection.dto.PlanAssignmentRequest;
import vn.ksvh.qc.inspection.dto.PlanAssignmentResponse;
import vn.ksvh.qc.inspection.dto.PlanCreateRequest;
import vn.ksvh.qc.inspection.dto.PlanRejectRequest;
import vn.ksvh.qc.inspection.dto.PlanResponse;
import vn.ksvh.qc.inspection.dto.PlanUpdateRequest;
import vn.ksvh.qc.inspection.dto.PriorFindingsWarning;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.NotFoundException;
import vn.ksvh.qc.shared.util.BusinessDates;
import vn.ksvh.qc.shared.web.PageResponse;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InspectionPlanService {

    private final Clock clock;
    private final InspectionPlanRepository planRepository;
    private final UserAccountApi userAccountApi;
    private final PlanAssignmentRepository planAssignmentRepository;
    private final OrgUnitLookupApi orgUnitLookupApi;
    private final CriteriaLookupApi criteriaLookupApi;
    private final InspectionRepository inspectionRepository;
    private final InspectionService inspectionService;
    private final FindingRepository findingRepository;
    private final ApplicationEventPublisher eventPublisher;

    public PageResponse<PlanResponse> search(String keyword, PlanStatus status, Pageable pageable) {
        Specification<InspectionPlan> spec = Specification.unrestricted();
        if (StringUtils.hasText(keyword)) {
            String kw = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("planCode")), kw),
                    cb.like(cb.lower(root.get("title")), kw)
            ));
        }
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }
        var page = planRepository.findAll(spec, pageable);

        var userIds = page.getContent().stream()
                .flatMap(p -> Stream.of(p.getCreatedBy(), p.getApprovedBy()))
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<Long, UserSummary> users = userAccountApi.findSummaries(userIds);

        var planIds = page.getContent().stream().map(InspectionPlan::getId).toList();
        List<PlanAssignment> allAssignments = planAssignmentRepository.findByPlanIdIn(planIds);
        Map<Long, Long> counts = allAssignments.stream()
                .collect(Collectors.groupingBy(PlanAssignment::getPlanId, Collectors.counting()));

        return PageResponse.of(page, p -> {
            String createdByName = p.getCreatedBy() != null && users.containsKey(p.getCreatedBy())
                    ? users.get(p.getCreatedBy()).fullName() : null;
            String approvedByName = p.getApprovedBy() != null && users.containsKey(p.getApprovedBy())
                    ? users.get(p.getApprovedBy()).fullName() : null;
            int count = counts.getOrDefault(p.getId(), 0L).intValue();
            return PlanResponse.from(p, createdByName, approvedByName, count, List.of());
        });
    }

    public PlanResponse get(Long id) {
        InspectionPlan p = load(id);
        var users = userAccountApi.findSummaries(Stream.of(p.getCreatedBy(), p.getApprovedBy()).filter(Objects::nonNull).toList());
        String createdByName = p.getCreatedBy() != null && users.containsKey(p.getCreatedBy()) ? users.get(p.getCreatedBy()).fullName() : null;
        String approvedByName = p.getApprovedBy() != null && users.containsKey(p.getApprovedBy()) ? users.get(p.getApprovedBy()).fullName() : null;

        List<PlanAssignment> assignments = planAssignmentRepository.findByPlanIdOrderBySortOrderAscIdAsc(p.getId());
        if (assignments.isEmpty()) {
            return PlanResponse.from(p, createdByName, approvedByName, 0, List.of());
        }

        var restIds = assignments.stream().map(PlanAssignment::getRestaurantId).distinct().toList();
        var inspectorIds = assignments.stream().map(PlanAssignment::getInspectorId).distinct().toList();
        var templateIds = assignments.stream().map(PlanAssignment::getTemplateId).distinct().toList();
        var inspectionIds = assignments.stream().map(PlanAssignment::getInspectionId).filter(Objects::nonNull).distinct().toList();

        Map<Long, OrgUnitRef> rests = orgUnitLookupApi.findRefs(restIds);
        Map<Long, UserSummary> inspectors = userAccountApi.findSummaries(inspectorIds);
        Map<Long, TemplateRef> templates = criteriaLookupApi.findTemplates(templateIds);
        Map<Long, Inspection> inspections = inspectionRepository.findAllById(inspectionIds).stream()
                .collect(Collectors.toMap(Inspection::getId, Function.identity()));

        Instant planStartInstant = p.getStartDate().atStartOfDay(BusinessDates.ZONE).toInstant();
        List<Finding> activeFindings = findingRepository.findByRestaurantIdInAndStatusIn(
                restIds,
                List.of(FindingStatus.OPEN, FindingStatus.CONFIRMED, FindingStatus.APPEALED,
                        FindingStatus.APPEAL_MEETING, FindingStatus.REMEDIATING, FindingStatus.PENDING_VERIFICATION)
        );
        Map<Long, Long> priorUnresolvedCountByRest = activeFindings.stream()
                .filter(f -> f.getCreatedAt() != null && f.getCreatedAt().isBefore(planStartInstant))
                .collect(Collectors.groupingBy(Finding::getRestaurantId, Collectors.counting()));

        List<PlanAssignmentResponse> list = assignments.stream().map(a -> {
            OrgUnitRef r = rests.get(a.getRestaurantId());
            UserSummary ins = inspectors.get(a.getInspectorId());
            TemplateRef tpl = templates.get(a.getTemplateId());
            Inspection insp = a.getInspectionId() != null ? inspections.get(a.getInspectionId()) : null;
            int priorCount = priorUnresolvedCountByRest.getOrDefault(a.getRestaurantId(), 0L).intValue();

            return new PlanAssignmentResponse(
                    a.getId(),
                    a.getRestaurantId(),
                    r != null ? r.code() : null,
                    r != null ? r.name() : null,
                    a.getInspectorId(),
                    ins != null ? ins.fullName() : null,
                    a.getTemplateId(),
                    tpl != null ? tpl.name() : null,
                    a.getScheduledDate(),
                    a.getInspectionId(),
                    insp != null ? insp.getCode() : null,
                    insp != null ? insp.getStatus() : null,
                    priorCount
            );
        }).toList();

        return PlanResponse.from(p, createdByName, approvedByName, list.size(), list);
    }

    @Transactional
    public PlanResponse create(PlanCreateRequest req, Long actorId) {
        String code = req.planCode().trim();
        if (planRepository.existsByPlanCodeIgnoreCase(code)) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Mã kế hoạch '%s' đã tồn tại".formatted(code));
        }
        if (req.endDate().isBefore(req.startDate())) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
        }

        InspectionPlan p = new InspectionPlan();
        p.setPlanCode(code);
        p.setTitle(req.title().trim());
        p.setStartDate(req.startDate());
        p.setEndDate(req.endDate());
        p.setNotes(StringUtils.hasText(req.notes()) ? req.notes().trim() : null);
        p.setStatus(PlanStatus.DRAFT);
        p.setCreatedBy(actorId);

        InspectionPlan saved = planRepository.saveAndFlush(p);
        if (req.assignments() != null && !req.assignments().isEmpty()) {
            saveAssignments(saved, req.assignments());
        }

        return get(saved.getId());
    }

    @Transactional
    public PlanResponse update(Long id, PlanUpdateRequest req, Long actorId) {
        InspectionPlan p = load(id);
        if (p.getStatus() != PlanStatus.DRAFT && p.getStatus() != PlanStatus.REJECTED) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Chỉ có thể sửa kế hoạch ở trạng thái Bản nháp hoặc Bị từ chối");
        }
        if (req.endDate().isBefore(req.startDate())) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
        }

        p.setTitle(req.title().trim());
        p.setStartDate(req.startDate());
        p.setEndDate(req.endDate());
        p.setNotes(StringUtils.hasText(req.notes()) ? req.notes().trim() : null);

        InspectionPlan saved = planRepository.saveAndFlush(p);
        if (req.assignments() != null) {
            saveAssignments(saved, req.assignments());
        } else {
            validateExistingAssignmentsDateRange(saved);
        }

        return get(saved.getId());
    }

    @Transactional
    public PlanResponse submit(Long id, Long actorId) {
        InspectionPlan p = load(id);
        if (p.getStatus() != PlanStatus.DRAFT && p.getStatus() != PlanStatus.REJECTED) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Kế hoạch không ở trạng thái có thể gửi duyệt");
        }
        List<PlanAssignment> assignments = planAssignmentRepository.findByPlanIdOrderBySortOrderAscIdAsc(p.getId());
        if (assignments.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Kế hoạch phải có ít nhất một dòng phân công trước khi gửi duyệt");
        }
        p.setStatus(PlanStatus.PENDING_APPROVAL);
        p.setRejectionReason(null);
        PlanResponse res = get(planRepository.saveAndFlush(p).getId());
        eventPublisher.publishEvent(new PlanSubmittedEvent(p.getId(), p.getPlanCode(), p.getTitle(), p.getCreatedBy(), res.createdByName()));
        return res;
    }

    @Transactional
    public PlanResponse approve(Long id, Long actorId) {
        InspectionPlan p = load(id);
        if (p.getStatus() != PlanStatus.PENDING_APPROVAL) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Chỉ có thể duyệt kế hoạch đang chờ duyệt");
        }
        List<PlanAssignment> assignments = planAssignmentRepository.findByPlanIdOrderBySortOrderAscIdAsc(p.getId());
        if (assignments.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Kế hoạch không có dòng phân công nào");
        }

        p.setStatus(PlanStatus.APPROVED);
        p.setApprovedBy(actorId);
        p.setApprovedAt(clock.instant());
        p.setRejectionReason(null);
        planRepository.saveAndFlush(p);

        Set<Long> restaurantIds = assignments.stream().map(PlanAssignment::getRestaurantId).collect(Collectors.toSet());
        Map<Long, OrgUnitRef> restaurants = orgUnitLookupApi.findRefs(restaurantIds);

        for (PlanAssignment a : assignments) {
            OrgUnitRef rest = restaurants.get(a.getRestaurantId());
            String restCode = rest != null ? rest.code() : ("NH" + a.getRestaurantId());
            try {
                InspectionResponse created = inspectionService.createFromPlanAssignment(p, a, restCode, actorId);
                a.setInspectionId(created.id());
            } catch (Exception ex) {
                String restName = rest != null ? rest.name() : ("#" + a.getRestaurantId());
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Lỗi tạo phiếu cho nhà hàng '%s': %s".formatted(restName, ex.getMessage()), ex);
            }
        }
        planAssignmentRepository.saveAll(assignments);
        PlanResponse res = get(p.getId());
        Set<Long> assignedInspectors = assignments.stream().map(PlanAssignment::getInspectorId).collect(Collectors.toSet());
        eventPublisher.publishEvent(new PlanApprovedEvent(p.getId(), p.getPlanCode(), p.getTitle(), p.getCreatedBy(), actorId, res.approvedByName(), assignedInspectors, assignments.size()));
        eventPublisher.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                actorId, null, res.approvedByName(), "PLAN_APPROVE", "INSPECTION_PLAN",
                p.getPlanCode(), "Phê duyệt kế hoạch " + p.getPlanCode() + " (" + assignments.size() + " nhà hàng)", null
        ));
        return res;
    }

    @Transactional
    public PlanResponse reject(Long id, PlanRejectRequest req, Long actorId) {
        InspectionPlan p = load(id);
        if (p.getStatus() != PlanStatus.PENDING_APPROVAL) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Chỉ có thể từ chối kế hoạch đang chờ duyệt");
        }
        p.setStatus(PlanStatus.REJECTED);
        p.setRejectionReason(req.reason().trim());
        p.setApprovedBy(actorId);
        p.setApprovedAt(clock.instant());
        PlanResponse res = get(planRepository.saveAndFlush(p).getId());
        eventPublisher.publishEvent(new PlanRejectedEvent(p.getId(), p.getPlanCode(), p.getTitle(), p.getCreatedBy(), actorId, res.approvedByName(), req.reason().trim()));
        eventPublisher.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                actorId, null, res.approvedByName(), "PLAN_REJECT", "INSPECTION_PLAN",
                p.getPlanCode(), "Từ chối kế hoạch " + p.getPlanCode() + ": " + req.reason().trim(), req.reason().trim()
        ));
        return res;
    }

    @Transactional
    public void delete(Long id) {
        InspectionPlan p = load(id);
        if (p.getStatus() != PlanStatus.DRAFT && p.getStatus() != PlanStatus.REJECTED) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Chỉ có thể xoá kế hoạch ở trạng thái Bản nháp hoặc Bị từ chối");
        }
        planAssignmentRepository.deleteByPlanId(p.getId());
        planRepository.delete(p);
    }

    private void saveAssignments(InspectionPlan plan, List<PlanAssignmentRequest> requests) {
        planAssignmentRepository.deleteByPlanId(plan.getId());
        if (requests == null || requests.isEmpty()) {
            return;
        }

        Set<Long> restIds = requests.stream().map(PlanAssignmentRequest::restaurantId).collect(Collectors.toSet());
        Map<Long, OrgUnitRef> rests = orgUnitLookupApi.findRefs(restIds);

        Set<Long> inspectorIds = requests.stream().map(PlanAssignmentRequest::inspectorId).collect(Collectors.toSet());
        Map<Long, UserSummary> inspectors = userAccountApi.findSummaries(inspectorIds);

        Set<Long> templateIds = requests.stream().map(PlanAssignmentRequest::templateId).collect(Collectors.toSet());
        Map<Long, TemplateRef> templates = new HashMap<>();
        for (Long tId : templateIds) {
            criteriaLookupApi.findTemplate(tId).ifPresent(t -> templates.put(tId, t));
        }

        Set<Long> seenRestaurants = new HashSet<>();
        List<PlanAssignment> list = new ArrayList<>();

        for (int i = 0; i < requests.size(); i++) {
            PlanAssignmentRequest a = requests.get(i);

            OrgUnitRef rest = rests.get(a.restaurantId());
            if (rest == null || !"RESTAURANT".equals(rest.unitType()) || !rest.active()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Nhà hàng #" + a.restaurantId() + " không tồn tại hoặc đã ngừng hoạt động");
            }

            if (!seenRestaurants.add(a.restaurantId())) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Nhà hàng '%s' bị phân công trùng lặp trong kế hoạch".formatted(rest.name()));
            }

            if (a.scheduledDate().isBefore(plan.getStartDate()) || a.scheduledDate().isAfter(plan.getEndDate())) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Ngày kiểm tra (%s) của nhà hàng '%s' phải nằm trong khoảng thời gian kế hoạch [%s, %s]"
                                .formatted(a.scheduledDate(), rest.name(), plan.getStartDate(), plan.getEndDate()));
            }

            UserSummary inspector = inspectors.get(a.inspectorId());
            if (inspector == null || !inspector.active() || !inspector.hasRole(RoleCodes.KSVH_INSPECTOR)) {
                String name = inspector != null ? inspector.fullName() : ("#" + a.inspectorId());
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Người dùng '%s' không tồn tại, đã bị vô hiệu hoá hoặc không có vai trò Chuyên viên KSVH".formatted(name));
            }

            TemplateRef template = templates.get(a.templateId());
            if (template == null || !template.active()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Mẫu phiếu #" + a.templateId() + " không tồn tại hoặc đã bị vô hiệu hoá");
            }
            InspectionService.validateTemplateForAssignment(template, rest);

            PlanAssignment entity = new PlanAssignment();
            entity.setPlanId(plan.getId());
            entity.setRestaurantId(a.restaurantId());
            entity.setInspectorId(a.inspectorId());
            entity.setTemplateId(a.templateId());
            entity.setScheduledDate(a.scheduledDate());
            entity.setSortOrder(i);
            list.add(entity);
        }

        planAssignmentRepository.saveAll(list);
    }

    private void validateExistingAssignmentsDateRange(InspectionPlan plan) {
        List<PlanAssignment> existing = planAssignmentRepository.findByPlanIdOrderBySortOrderAscIdAsc(plan.getId());
        for (PlanAssignment a : existing) {
            if (a.getScheduledDate().isBefore(plan.getStartDate()) || a.getScheduledDate().isAfter(plan.getEndDate())) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Dòng phân công ngày %s nằm ngoài khoảng thời gian kế hoạch [%s, %s]".formatted(
                                a.getScheduledDate(), plan.getStartDate(), plan.getEndDate()));
            }
        }
    }

    private InspectionPlan load(Long id) {
        return planRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy kế hoạch #" + id));
    }

    public PriorFindingsWarning getRestaurantWarning(Long restaurantId, LocalDate beforeDate) {
        LocalDate cutOff = beforeDate != null ? beforeDate : BusinessDates.today(clock);
        Instant cutOffInstant = cutOff.atStartOfDay(BusinessDates.ZONE).toInstant();

        OrgUnitRef rest = orgUnitLookupApi.findRefs(List.of(restaurantId)).get(restaurantId);
        String rCode = rest != null ? rest.code() : ("#" + restaurantId);
        String rName = rest != null ? rest.name() : ("Nhà hàng #" + restaurantId);

        List<Finding> findings = findingRepository.findByRestaurantIdAndStatusIn(
                restaurantId,
                List.of(FindingStatus.OPEN, FindingStatus.CONFIRMED, FindingStatus.APPEALED,
                        FindingStatus.APPEAL_MEETING, FindingStatus.REMEDIATING, FindingStatus.PENDING_VERIFICATION)
        );

        List<Finding> priorFindings = findings.stream()
                .filter(f -> f.getCreatedAt() != null && f.getCreatedAt().isBefore(cutOffInstant))
                .toList();

        int unverified = (int) priorFindings.stream()
                .filter(f -> f.getStatus() == FindingStatus.PENDING_VERIFICATION)
                .count();

        var critIds = priorFindings.stream().map(Finding::getCriterionId).distinct().toList();
        Map<Long, CriterionRef> critMap = criteriaLookupApi.findCriteria(critIds);

        List<String> details = priorFindings.stream().map(f -> {
            CriterionRef c = critMap.get(f.getCriterionId());
            String critName = c != null ? c.name() : ("Tiêu chí #" + f.getCriterionId());
            return String.format("[%s] %s (%s) - Hạn: %s",
                    f.getRiskLevelCode(), critName, f.getStatus(), f.getDeadlineDate());
        }).toList();

        return new PriorFindingsWarning(restaurantId, rCode, rName, unverified, priorFindings.size(), details);
    }
}

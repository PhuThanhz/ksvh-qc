package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.criteria.api.CriteriaLookupApi;
import vn.ksvh.qc.criteria.api.TemplateRef;
import vn.ksvh.qc.inspection.api.event.PlanApprovedEvent;
import vn.ksvh.qc.inspection.api.event.PlanRejectedEvent;
import vn.ksvh.qc.inspection.api.event.PlanSubmittedEvent;
import vn.ksvh.qc.inspection.domain.InspectionPlan;
import vn.ksvh.qc.inspection.domain.InspectionPlanRepository;
import vn.ksvh.qc.inspection.domain.PlanAssignment;
import vn.ksvh.qc.inspection.domain.PlanAssignmentRepository;
import vn.ksvh.qc.inspection.domain.PlanStatus;
import vn.ksvh.qc.inspection.dto.InspectionResponse;
import vn.ksvh.qc.inspection.dto.PlanAssignmentRequest;
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
import java.util.*;
import java.util.stream.Collectors;

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
    private final InspectionService inspectionService;
    private final ApplicationEventPublisher eventPublisher;
    private final InspectionPlanQueryService queryService;

    public PageResponse<PlanResponse> search(String keyword, PlanStatus status, Pageable pageable) {
        return queryService.search(keyword, status, pageable);
    }

    public PlanResponse get(Long id) {
        return queryService.get(id);
    }

    public List<PlanAssignmentRequest> getCopyableAssignments(Long sourcePlanId, LocalDate targetStartDate, LocalDate targetEndDate) {
        return queryService.getCopyableAssignments(sourcePlanId, targetStartDate, targetEndDate);
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
        return queryService.getRestaurantWarning(restaurantId, beforeDate);
    }
}

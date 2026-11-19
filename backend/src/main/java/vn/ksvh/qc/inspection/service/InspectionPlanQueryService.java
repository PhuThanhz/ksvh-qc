package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.criteria.api.CriteriaLookupApi;
import vn.ksvh.qc.criteria.api.CriterionRef;
import vn.ksvh.qc.criteria.api.TemplateRef;
import vn.ksvh.qc.inspection.domain.*;
import vn.ksvh.qc.inspection.dto.PlanAssignmentRequest;
import vn.ksvh.qc.inspection.dto.PlanAssignmentResponse;
import vn.ksvh.qc.inspection.dto.PlanResponse;
import vn.ksvh.qc.inspection.dto.PriorFindingsWarning;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.shared.error.NotFoundException;
import vn.ksvh.qc.shared.util.BusinessDates;
import vn.ksvh.qc.shared.web.PageResponse;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InspectionPlanQueryService {

    private final Clock clock;
    private final InspectionPlanRepository planRepository;
    private final UserAccountApi userAccountApi;
    private final PlanAssignmentRepository planAssignmentRepository;
    private final OrgUnitLookupApi orgUnitLookupApi;
    private final CriteriaLookupApi criteriaLookupApi;
    private final InspectionRepository inspectionRepository;
    private final FindingRepository findingRepository;

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
        Map<Long, Long> counts = planIds.isEmpty() ? Map.of() : planAssignmentRepository.countByPlanIdIn(planIds).stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> ((Number) row[1]).longValue()
                ));

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
        InspectionPlan p = planRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy kế hoạch #" + id));
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

    public List<PlanAssignmentRequest> getCopyableAssignments(Long sourcePlanId, LocalDate targetStartDate, LocalDate targetEndDate) {
        InspectionPlan sourcePlan = planRepository.findById(sourcePlanId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy kế hoạch nguồn #" + sourcePlanId));
        List<PlanAssignment> assignments = planAssignmentRepository.findByPlanId(sourcePlanId);
        return assignments.stream().map(a -> {
            long offsetDays = java.time.temporal.ChronoUnit.DAYS.between(sourcePlan.getStartDate(), a.getScheduledDate());
            LocalDate newDate = targetStartDate.plusDays(Math.max(0, offsetDays));
            if (newDate.isAfter(targetEndDate)) {
                newDate = targetEndDate;
            }
            return new PlanAssignmentRequest(a.getRestaurantId(), a.getInspectorId(), a.getTemplateId(), newDate);
        }).toList();
    }
}

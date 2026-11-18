package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.ksvh.qc.criteria.api.TemplateRef;
import vn.ksvh.qc.inspection.domain.Inspection;
import vn.ksvh.qc.inspection.domain.InspectionPlan;
import vn.ksvh.qc.inspection.domain.InspectionStatus;
import vn.ksvh.qc.inspection.domain.PlanAssignment;
import vn.ksvh.qc.inspection.dto.*;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.shared.web.PageResponse;

import java.util.List;

/**
 * Facade service for inspection management: delegating querying, creation, and execution
 * to dedicated specialized domain services.
 */
@Service
@RequiredArgsConstructor
public class InspectionService {

    private final InspectionQueryService queryService;
    private final InspectionCreationService creationService;
    private final InspectionExecutionService executionService;

    public PageResponse<InspectionResponse> search(String keyword, Long restaurantId, Long inspectorId,
                                                  InspectionStatus status, Pageable pageable, CurrentUser user) {
        return queryService.search(keyword, restaurantId, inspectorId, status, pageable, user);
    }

    public List<InspectionResponse> listMyInspections(Long inspectorId) {
        return queryService.listMyInspections(inspectorId);
    }

    public InspectionResponse get(Long id, CurrentUser user) {
        return queryService.get(id, user);
    }

    public List<InspectionItemResponse> listItems(Long id, CurrentUser user) {
        return queryService.listItems(id, user);
    }

    public InspectionResponse create(InspectionCreateRequest req, CurrentUser user) {
        return creationService.create(req, user);
    }

    public InspectionResponse createFromPlanAssignment(InspectionPlan plan, PlanAssignment a, String restaurantCode, Long actorId) {
        return creationService.createFromPlanAssignment(plan, a, restaurantCode, actorId);
    }

    public List<InspectionResponse> createBatch(InspectionBatchCreateRequest req, CurrentUser user) {
        return creationService.createBatch(req, user);
    }

    public InspectionResponse checkin(Long id, InspectionCheckinRequest req, CurrentUser user) {
        return executionService.checkin(id, req, user);
    }

    public InspectionResponse submit(Long id, InspectionSubmitRequest req, CurrentUser user) {
        return executionService.submit(id, req, user);
    }

    public InspectionResponse acknowledge(Long id, CurrentUser user) {
        return executionService.acknowledge(id, user);
    }

    public InspectionResponse cancel(Long id, InspectionCancelRequest req, CurrentUser user) {
        return executionService.cancel(id, req, user);
    }

    public static void validateTemplateForAssignment(TemplateRef template, OrgUnitRef restaurant) {
        InspectionCreationService.validateTemplateForAssignment(template, restaurant);
    }
}

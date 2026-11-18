package vn.ksvh.qc.inspection.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import vn.ksvh.qc.inspection.domain.PlanStatus;
import vn.ksvh.qc.inspection.dto.PlanAssignmentRequest;
import vn.ksvh.qc.inspection.dto.PlanCreateRequest;
import vn.ksvh.qc.inspection.dto.PlanRejectRequest;
import vn.ksvh.qc.inspection.dto.PlanResponse;
import vn.ksvh.qc.inspection.dto.PlanUpdateRequest;
import vn.ksvh.qc.inspection.dto.PriorFindingsWarning;
import vn.ksvh.qc.inspection.service.InspectionPlanService;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.web.ApiPaths;
import vn.ksvh.qc.shared.web.PageResponse;

import java.util.List;

@RestController
@RequestMapping(ApiPaths.V1 + "/inspection-plans")
@RequiredArgsConstructor
public class InspectionPlanController {

    private final InspectionPlanService service;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.PLAN_READ + "')")
    public PageResponse<PlanResponse> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) PlanStatus status,
            @ParameterObject @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.search(keyword, status, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.PLAN_READ + "')")
    public PlanResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @GetMapping("/{id}/copyable-assignments")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.PLAN_READ + "', '" + PermissionCodes.PLAN_CREATE + "')")
    public List<PlanAssignmentRequest> getCopyableAssignments(
            @PathVariable Long id,
            @RequestParam java.time.LocalDate targetStartDate,
            @RequestParam java.time.LocalDate targetEndDate) {
        return service.getCopyableAssignments(id, targetStartDate, targetEndDate);
    }

    @GetMapping("/restaurant-warnings")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.PLAN_READ + "', '" + PermissionCodes.PLAN_CREATE + "')")
    public PriorFindingsWarning getRestaurantWarning(
            @RequestParam Long restaurantId,
            @RequestParam(required = false) java.time.LocalDate beforeDate) {
        return service.getRestaurantWarning(restaurantId, beforeDate);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.PLAN_CREATE + "')")
    public PlanResponse create(@Valid @RequestBody PlanCreateRequest req, @AuthenticationPrincipal Jwt jwt) {
        return service.create(req, CurrentUser.from(jwt).id());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.PLAN_CREATE + "')")
    public PlanResponse update(@PathVariable Long id, @Valid @RequestBody PlanUpdateRequest req, @AuthenticationPrincipal Jwt jwt) {
        return service.update(id, req, CurrentUser.from(jwt).id());
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.PLAN_CREATE + "')")
    public PlanResponse submit(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return service.submit(id, CurrentUser.from(jwt).id());
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.PLAN_APPROVE + "')")
    public PlanResponse approve(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return service.approve(id, CurrentUser.from(jwt).id());
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.PLAN_APPROVE + "')")
    public PlanResponse reject(@PathVariable Long id, @Valid @RequestBody PlanRejectRequest req, @AuthenticationPrincipal Jwt jwt) {
        return service.reject(id, req, CurrentUser.from(jwt).id());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.PLAN_CREATE + "')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}

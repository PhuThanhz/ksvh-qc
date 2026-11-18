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
import vn.ksvh.qc.inspection.domain.InspectionStatus;
import vn.ksvh.qc.inspection.dto.*;
import vn.ksvh.qc.inspection.service.InspectionService;
import vn.ksvh.qc.inspection.service.SurpriseInspectionSuggestionService;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.web.ApiPaths;
import vn.ksvh.qc.shared.web.PageResponse;

import java.util.List;

@RestController
@RequestMapping(ApiPaths.V1 + "/inspections")
@RequiredArgsConstructor
public class InspectionController {

    private final InspectionService service;
    private final SurpriseInspectionSuggestionService suggestionService;

    @GetMapping("/surprise-suggestions")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.PLAN_CREATE + "', '" + PermissionCodes.INSPECTION_PERFORM + "', '" + PermissionCodes.INSPECTION_READ_ALL + "', '" + PermissionCodes.INSPECTION_READ_OWN + "')")
    public List<SurpriseInspectionSuggestion> getSurpriseSuggestions(@AuthenticationPrincipal Jwt jwt) {
        return suggestionService.getSuggestions(CurrentUser.from(jwt));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.INSPECTION_READ_ALL + "', '" + PermissionCodes.INSPECTION_READ_OWN + "')")
    public PageResponse<InspectionResponse> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long restaurantId,
            @RequestParam(required = false) Long inspectorId,
            @RequestParam(required = false) InspectionStatus status,
            @ParameterObject @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal Jwt jwt) {
        return service.search(keyword, restaurantId, inspectorId, status, pageable, CurrentUser.from(jwt));
    }

    @GetMapping("/my-tasks")
    @PreAuthorize("isAuthenticated()")
    public List<InspectionResponse> myTasks(@AuthenticationPrincipal Jwt jwt) {
        return service.listMyInspections(CurrentUser.from(jwt).id());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.INSPECTION_READ_ALL + "', '" + PermissionCodes.INSPECTION_READ_OWN + "')")
    public InspectionResponse get(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return service.get(id, CurrentUser.from(jwt));
    }

    @GetMapping("/{id}/items")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.INSPECTION_READ_ALL + "', '" + PermissionCodes.INSPECTION_READ_OWN + "', '" + PermissionCodes.INSPECTION_PERFORM + "')")
    public List<InspectionItemResponse> getItems(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return service.listItems(id, CurrentUser.from(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.PLAN_CREATE + "', '" + PermissionCodes.INSPECTION_PERFORM + "')")
    public InspectionResponse create(@Valid @RequestBody InspectionCreateRequest req, @AuthenticationPrincipal Jwt jwt) {
        return service.create(req, CurrentUser.from(jwt));
    }

    @PostMapping("/batch")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.PLAN_CREATE + "', '" + PermissionCodes.INSPECTION_PERFORM + "')")
    public List<InspectionResponse> createBatch(@Valid @RequestBody InspectionBatchCreateRequest req, @AuthenticationPrincipal Jwt jwt) {
        return service.createBatch(req, CurrentUser.from(jwt));
    }

    @PostMapping("/{id}/checkin")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.INSPECTION_PERFORM + "')")
    public InspectionResponse checkin(@PathVariable Long id, @Valid @RequestBody InspectionCheckinRequest req,
                                      @AuthenticationPrincipal Jwt jwt) {
        return service.checkin(id, req, CurrentUser.from(jwt));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.INSPECTION_PERFORM + "')")
    public InspectionResponse submit(@PathVariable Long id, @Valid @RequestBody InspectionSubmitRequest req,
                                     @AuthenticationPrincipal Jwt jwt) {
        return service.submit(id, req, CurrentUser.from(jwt));
    }

    /** CHT xác nhận đã xem phiếu không có lỗi (AWAITING_ACK → COMPLETED). */
    @PostMapping("/{id}/acknowledge")
    @PreAuthorize("hasAuthority('" + PermissionCodes.FINDING_RESPOND + "')")
    public InspectionResponse acknowledge(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return service.acknowledge(id, CurrentUser.from(jwt));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.INSPECTION_CANCEL + "')")
    public InspectionResponse cancel(@PathVariable Long id, @Valid @RequestBody InspectionCancelRequest req,
                                     @AuthenticationPrincipal Jwt jwt) {
        return service.cancel(id, req, CurrentUser.from(jwt));
    }
}

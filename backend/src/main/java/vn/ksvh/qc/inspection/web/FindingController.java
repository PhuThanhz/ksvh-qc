package vn.ksvh.qc.inspection.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import vn.ksvh.qc.inspection.domain.FindingStatus;
import vn.ksvh.qc.inspection.dto.*;
import vn.ksvh.qc.inspection.service.FindingService;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.web.ApiPaths;
import vn.ksvh.qc.shared.web.PageResponse;

import java.util.List;

@RestController
@RequestMapping(ApiPaths.V1 + "/findings")
@RequiredArgsConstructor
public class FindingController {

    private final FindingService service;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.INSPECTION_READ_ALL + "', '" + PermissionCodes.INSPECTION_READ_OWN + "', '" + PermissionCodes.FINDING_RESPOND + "', '" + PermissionCodes.FINDING_VERIFY + "')")
    public PageResponse<FindingResponse> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long restaurantId,
            @RequestParam(required = false) Long inspectionId,
            @RequestParam(required = false) FindingStatus status,
            @ParameterObject @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal Jwt jwt) {
        return service.search(keyword, restaurantId, inspectionId, status, pageable, CurrentUser.from(jwt));
    }

    @GetMapping("/pending-reviews")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.FINDING_REVIEW_APPEAL + "')")
    public List<FindingResponse> getPendingReviews(@AuthenticationPrincipal Jwt jwt) {
        return service.getPendingReviews(CurrentUser.from(jwt));
    }

    @GetMapping("/verification-candidates")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.PLAN_CREATE + "', '" + PermissionCodes.INSPECTION_PERFORM + "', '" + PermissionCodes.INSPECTION_READ_ALL + "', '" + PermissionCodes.INSPECTION_READ_OWN + "', '" + PermissionCodes.FINDING_VERIFY + "')")
    public List<CandidateFindingResponse> getVerificationCandidates(@RequestParam Long restaurantId,
                                                                   @AuthenticationPrincipal Jwt jwt) {
        return service.listCandidatesForVerification(restaurantId, CurrentUser.from(jwt));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.INSPECTION_READ_ALL + "', '" + PermissionCodes.INSPECTION_READ_OWN + "', '" + PermissionCodes.FINDING_RESPOND + "', '" + PermissionCodes.FINDING_VERIFY + "')")
    public FindingResponse get(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return service.get(id, CurrentUser.from(jwt));
    }

    @GetMapping("/{id}/candidate-reviewers")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.FINDING_RESPOND + "', '" + PermissionCodes.INSPECTION_READ_ALL + "', '" + PermissionCodes.INSPECTION_READ_OWN + "')")
    public List<CandidateReviewerResponse> getCandidateReviewers(@PathVariable Long id,
                                                                 @AuthenticationPrincipal Jwt jwt) {
        return service.getCandidateReviewers(id, CurrentUser.from(jwt));
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.FINDING_RESPOND + "')")
    public FindingResponse confirm(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return service.confirm(id, CurrentUser.from(jwt));
    }

    @PostMapping("/{id}/appeal")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.FINDING_RESPOND + "')")
    public FindingResponse appeal(@PathVariable Long id, @Valid @RequestBody FindingAppealRequest req,
                                  @AuthenticationPrincipal Jwt jwt) {
        return service.appeal(id, req, CurrentUser.from(jwt));
    }

    @PostMapping("/{id}/appeal-reviews")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.FINDING_REVIEW_APPEAL + "')")
    public FindingResponse submitAppealReview(@PathVariable Long id, @Valid @RequestBody AppealReviewRequest req,
                                              @AuthenticationPrincipal Jwt jwt) {
        return service.submitAppealReview(id, req, CurrentUser.from(jwt));
    }

    @PostMapping("/{id}/conclude-appeal")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.FINDING_CONCLUDE_APPEAL + "')")
    public FindingResponse concludeAppeal(@PathVariable Long id, @Valid @RequestBody FindingConcludeAppealRequest req,
                                          @AuthenticationPrincipal Jwt jwt) {
        return service.concludeAppeal(id, req, CurrentUser.from(jwt));
    }

    @PostMapping("/{id}/remediation-plan")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.FINDING_REMEDIATE + "')")
    public FindingResponse setRemediationPlan(@PathVariable Long id, @Valid @RequestBody FindingRemediationPlanRequest req,
                                             @AuthenticationPrincipal Jwt jwt) {
        return service.setRemediationPlan(id, req, CurrentUser.from(jwt));
    }

    @PostMapping("/{id}/submit-remediation")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.FINDING_REMEDIATE + "')")
    public FindingResponse submitRemediation(@PathVariable Long id, @Valid @RequestBody FindingSubmitRemediationRequest req,
                                            @AuthenticationPrincipal Jwt jwt) {
        return service.submitRemediation(id, req, CurrentUser.from(jwt));
    }

    @PostMapping("/{id}/verify")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.FINDING_VERIFY + "')")
    public FindingResponse verify(@PathVariable Long id, @Valid @RequestBody FindingVerifyRequest req,
                                  @AuthenticationPrincipal Jwt jwt) {
        return service.verify(id, req, CurrentUser.from(jwt));
    }
}

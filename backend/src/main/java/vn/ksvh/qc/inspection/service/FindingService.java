package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.ksvh.qc.inspection.domain.Finding;
import vn.ksvh.qc.inspection.domain.FindingStatus;
import vn.ksvh.qc.inspection.dto.*;
import vn.ksvh.qc.inspection.service.finding.FindingQueryService;
import vn.ksvh.qc.inspection.service.finding.FindingRemediationService;
import vn.ksvh.qc.inspection.service.finding.FindingResponseService;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.shared.web.PageResponse;

import java.util.List;

/**
 * Facade service for finding lifecycle management, querying, appeals, and remediations.
 */
@Service
@RequiredArgsConstructor
public class FindingService {

    private final FindingQueryService queryService;
    private final FindingResponseService responseService;
    private final FindingRemediationService remediationService;

    public PageResponse<FindingResponse> search(String keyword, Long restaurantId, Long inspectionId, FindingStatus status,
                                                Pageable pageable, CurrentUser user) {
        return queryService.search(keyword, restaurantId, inspectionId, status, pageable, user);
    }

    public FindingResponse get(Long id, CurrentUser user) {
        return queryService.get(id, user);
    }

    public FindingResponse confirm(Long id, CurrentUser user) {
        return responseService.confirm(id, user);
    }

    public FindingResponse appeal(Long id, FindingAppealRequest req, CurrentUser user) {
        return responseService.appeal(id, req, user);
    }

    public FindingResponse submitAppealReview(Long findingId, AppealReviewRequest req, CurrentUser user) {
        return responseService.submitAppealReview(findingId, req, user);
    }

    public FindingResponse concludeAppeal(Long id, FindingConcludeAppealRequest req, CurrentUser user) {
        return responseService.concludeAppeal(id, req, user);
    }

    public List<CandidateReviewerResponse> getCandidateReviewers(Long id, CurrentUser user) {
        return queryService.getCandidateReviewers(id, user);
    }

    public List<FindingResponse> getPendingReviews(CurrentUser user) {
        return queryService.getPendingReviews(user);
    }

    public FindingResponse setRemediationPlan(Long id, FindingRemediationPlanRequest req, CurrentUser user) {
        return remediationService.setRemediationPlan(id, req, user);
    }

    public FindingResponse submitRemediation(Long id, FindingSubmitRemediationRequest req, CurrentUser user) {
        return remediationService.submitRemediation(id, req, user);
    }

    public FindingResponse verify(Long id, FindingVerifyRequest req, CurrentUser user) {
        return remediationService.verify(id, req, user);
    }

    public FindingResponse verifyInternal(Finding f, boolean passed, String comment, Long actorId, String actorUsername) {
        return remediationService.verifyInternal(f, passed, comment, actorId, actorUsername);
    }

    public List<CandidateFindingResponse> listCandidatesForVerification(Long restaurantId, CurrentUser user) {
        return queryService.listCandidatesForVerification(restaurantId, user);
    }

    public int markOverdueFindings() {
        return remediationService.markOverdueFindings();
    }

    public int sendDueReminders() {
        return remediationService.sendDueReminders();
    }
}

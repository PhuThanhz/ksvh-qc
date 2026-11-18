package vn.ksvh.qc.inspection.service.finding;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import vn.ksvh.qc.criteria.api.CriteriaLookupApi;
import vn.ksvh.qc.inspection.domain.*;
import vn.ksvh.qc.inspection.service.RiskAssessor;
import vn.ksvh.qc.inspection.dto.AppealReviewResponse;
import vn.ksvh.qc.inspection.dto.FindingEventResponse;
import vn.ksvh.qc.inspection.dto.FindingResponse;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.risk.RiskAssessment;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.NotFoundException;
import vn.ksvh.qc.shared.util.BusinessDates;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Stream;

@Component
@RequiredArgsConstructor
public class FindingLifecycle {

    private final FindingRepository findingRepository;
    private final FindingOccurrenceRepository occurrenceRepository;
    private final FindingEventRepository eventRepository;
    private final AppealReviewRepository appealReviewRepository;
    private final InspectionRepository inspectionRepository;
    private final OrgUnitLookupApi orgUnitLookupApi;
    private final CriteriaLookupApi criteriaLookupApi;
    private final UserAccountApi userAccountApi;
    private final RiskAssessor riskAssessor;
    private final Clock clock;

    public Finding load(Long id) {
        return findingRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy lỗi vi phạm #" + id));
    }

    public Inspection inspectionOf(Finding f) {
        return inspectionRepository.findById(f.getInspectionId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu chấm #" + f.getInspectionId()));
    }

    public void requireStatus(Finding f, String message, FindingStatus expected) {
        if (f.getStatus() != expected) {
            throw new BusinessException(ErrorCode.FINDING_INVALID_STATE, message);
        }
    }

    public void transition(Finding f, FindingStatus to, FindingEventAction action, CurrentUser user, String note) {
        FindingStatus from = f.getStatus();
        f.setStatus(to);
        eventRepository.save(new FindingEvent(f.getId(), action, from, to, user != null ? user.id() : null, note, clock.instant()));
    }

    public void transitionWithActorId(Finding f, FindingStatus to, FindingEventAction action, Long actorId, String note) {
        FindingStatus from = f.getStatus();
        f.setStatus(to);
        eventRepository.save(new FindingEvent(f.getId(), action, from, to, actorId, note, clock.instant()));
    }

    public void reassess(Finding f) {
        RiskAssessment r = riskAssessor.assessNew(f.getRestaurantId(), f.getCriterionId(), f.getBaseImpact(), BusinessDates.today(clock));
        f.setEffectiveImpact((short) r.effectiveImpact());
        f.setViolationCount(r.frequency());
        f.setCalculatedScore(r.score());
        f.setRiskLevelCode(r.band().code());
        f.setRiskLevelName(r.band().name());
        f.setRemediationDays(r.band().remediationDays());
    }

    public void addOccurrence(Finding f, OccurrenceSource source) {
        occurrenceRepository.save(new FindingOccurrence(f.getRestaurantId(), f.getCriterionId(), f.getId(), source, clock.instant()));
    }

    public void completeInspectionIfDone(Long inspectionId) {
        List<Finding> list = findingRepository.findByInspectionId(inspectionId);
        boolean allFinished = list.stream().allMatch(it -> it.getStatus() == FindingStatus.CLOSED || it.getStatus() == FindingStatus.DISMISSED);
        if (!allFinished) {
            return;
        }
        inspectionRepository.findById(inspectionId)
                .filter(ins -> ins.getStatus() == InspectionStatus.SUBMITTED)
                .ifPresent(ins -> {
                    ins.setStatus(InspectionStatus.COMPLETED);
                    ins.setCompletedAt(clock.instant());
                });
    }

    public FindingResponse save(Finding f) {
        return toResponse(findingRepository.saveAndFlush(f));
    }

    public FindingResponse toResponse(Finding f) {
        var rest = orgUnitLookupApi.findRefs(List.of(f.getRestaurantId())).get(f.getRestaurantId());
        var crit = criteriaLookupApi.findCriteria(List.of(f.getCriterionId())).get(f.getCriterionId());
        var ins = inspectionRepository.findById(f.getInspectionId()).orElse(null);
        List<FindingEvent> events = eventRepository.findByFindingIdOrderByCreatedAtAscIdAsc(f.getId());
        List<AppealReview> reviews = appealReviewRepository
                .findByFindingIdAndAppealRoundOrderByCreatedAtAsc(f.getId(), f.getAppealRound());

        var users = userAccountApi.findSummaries(Stream.concat(
                Stream.concat(
                        Stream.of(f.getVerifiedBy(), f.getAppealConcludedBy()),
                        events.stream().map(FindingEvent::getActorId)
                ),
                reviews.stream().map(AppealReview::getReviewerId)
        ).filter(Objects::nonNull).distinct().toList());

        List<AppealReviewResponse> appealReviews = reviews.stream()
                .map(r -> AppealReviewResponse.from(r, nameOf(users, r.getReviewerId())))
                .toList();

        return FindingResponse.from(f,
                ins != null ? ins.getCode() : null,
                rest != null ? rest.name() : null,
                crit != null ? crit.code() : null,
                crit != null ? crit.name() : null,
                nameOf(users, f.getVerifiedBy()),
                nameOf(users, f.getAppealConcludedBy()),
                events.stream().map(e -> FindingEventResponse.from(e, nameOf(users, e.getActorId()))).toList(),
                appealReviews
        );
    }

    public static String nameOf(Map<Long, UserSummary> users, Long id) {
        UserSummary u = id == null ? null : users.get(id);
        return u != null ? u.fullName() : null;
    }
}

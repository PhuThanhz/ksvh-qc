package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.criteria.api.CriteriaLookupApi;
import vn.ksvh.qc.inspection.api.event.FindingM4AlertEvent;
import vn.ksvh.qc.inspection.api.event.InspectionSubmittedEvent;
import vn.ksvh.qc.inspection.domain.*;
import vn.ksvh.qc.inspection.dto.InspectionCancelRequest;
import vn.ksvh.qc.inspection.dto.InspectionCheckinRequest;
import vn.ksvh.qc.inspection.dto.InspectionResponse;
import vn.ksvh.qc.inspection.dto.InspectionSubmitItemRequest;
import vn.ksvh.qc.inspection.dto.InspectionSubmitRequest;
import vn.ksvh.qc.media.api.EvidenceApi;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.risk.RiskAssessment;
import vn.ksvh.qc.risk.RiskBand;
import vn.ksvh.qc.risk.RiskRules;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.NotFoundException;
import vn.ksvh.qc.shared.util.BusinessDates;
import vn.ksvh.qc.shared.util.GeoUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InspectionExecutionService {

    private final InspectionRepository inspectionRepository;
    private final FindingRepository findingRepository;
    private final FindingOccurrenceRepository occurrenceRepository;
    private final FindingEventRepository eventRepository;
    private final CriteriaLookupApi criteriaLookupApi;
    private final OrgUnitLookupApi orgUnitLookupApi;
    private final InspectionAccess access;
    private final EvidenceApi evidenceApi;
    private final RiskAssessor riskAssessor;
    private final InspectionVerificationService verificationService;
    private final InspectionQueryService queryService;
    private final Clock clock;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public InspectionResponse checkin(Long id, InspectionCheckinRequest req, CurrentUser user) {
        Inspection inspection = queryService.load(id);
        access.requireAssignedInspector(inspection, user);
        if (inspection.getStatus() != InspectionStatus.ASSIGNED) {
            throw new BusinessException(ErrorCode.INSPECTION_INVALID_STATE, "Phiếu này đã check-in hoặc đã kết thúc");
        }

        OrgUnitRef rest = orgUnitLookupApi.findRefs(List.of(inspection.getRestaurantId())).get(inspection.getRestaurantId());
        if (rest == null) {
            throw new NotFoundException("Không tìm thấy thông tin nhà hàng #" + inspection.getRestaurantId());
        }
        boolean hasFix = req.latitude() != null && req.longitude() != null;
        if (hasFix) {
            inspection.setCheckinLat(req.latitude());
            inspection.setCheckinLng(req.longitude());
        }
        if (inspection.getInspectionMode() == InspectionMode.REMOTE) {
            inspection.setLocationStatus(LocationStatus.REMOTE);
        } else if (hasFix && rest.latitude() != null && rest.longitude() != null) {
            double distance = GeoUtils.distanceMeters(req.latitude(), req.longitude(), rest.latitude(), rest.longitude());
            inspection.setCheckinDistanceM(distance);
            inspection.setLocationStatus(rest.checkinRadiusM() == null ? LocationStatus.UNVERIFIED
                    : distance <= rest.checkinRadiusM() ? LocationStatus.VERIFIED : LocationStatus.OUTSIDE_RADIUS);
        } else {
            inspection.setLocationStatus(LocationStatus.UNVERIFIED);
        }
        inspection.setCheckinAt(clock.instant());
        inspection.setStatus(InspectionStatus.IN_PROGRESS);

        return queryService.toResponse(inspectionRepository.saveAndFlush(inspection));
    }

    @Transactional
    public InspectionResponse submit(Long id, InspectionSubmitRequest req, CurrentUser user) {
        Inspection inspection = queryService.load(id);
        access.requireAssignedInspector(inspection, user);
        if (inspection.getStatus() != InspectionStatus.IN_PROGRESS) {
            throw new BusinessException(ErrorCode.INSPECTION_INVALID_STATE,
                    "Phiếu chưa check-in GPS hoặc đã gửi, không thể gửi kết quả");
        }

        if (inspection.getInspectionType() == InspectionKind.VERIFICATION) {
            return verificationService.submitVerification(inspection, req, user);
        }

        Map<Long, InspectionSubmitItemRequest> submitMap = validateSubmission(inspection, req);
        Map<Long, String> evidenceByCriterion = new HashMap<>();
        submitMap.forEach((criterionId, sub) -> {
            String keys = evidenceApi.requireUploaded(sub.evidenceUrls(), user.id());
            if (keys != null) {
                evidenceByCriterion.put(criterionId, keys);
            }
        });

        Instant now = clock.instant();
        LocalDate today = BusinessDates.today(clock);

        List<InspectionSubmitItemRequest> failedSubs = submitMap.values().stream()
                .filter(s -> s.result() == ItemResult.FAIL)
                .toList();
        boolean hasFail = !failedSubs.isEmpty();

        RiskRules rules = hasFail ? riskAssessor.rulesFor(inspection.getRestaurantId(), today) : null;
        Map<Long, List<LocalDate>> occurrencesByCriterion = Map.of();
        if (hasFail) {
            List<Long> failedCritIds = failedSubs.stream().map(InspectionSubmitItemRequest::criterionId).distinct().toList();
            occurrencesByCriterion = occurrenceRepository.findByRestaurantIdAndCriterionIdIn(inspection.getRestaurantId(), failedCritIds).stream()
                    .collect(Collectors.groupingBy(
                            FindingOccurrence::getCriterionId,
                            Collectors.mapping(o -> o.getOccurredAt().atZone(BusinessDates.ZONE).toLocalDate(), Collectors.toList())
                    ));
        }

        List<FindingEvent> eventsToSave = new ArrayList<>();
        List<Finding> createdFindings = new ArrayList<>();
        Map<Long, String> criterionNamesByFindingId = new HashMap<>();
        for (InspectionItem item : inspection.getItems()) {
            InspectionSubmitItemRequest sub = submitMap.get(item.getCriterionId());
            item.setResult(sub.result());
            item.setComment(trimToNull(sub.comment()));
            item.setEvidenceUrls(evidenceByCriterion.get(item.getCriterionId()));
            item.setEvaluatedAt(now);

            if (sub.result() != ItemResult.FAIL) {
                continue;
            }

            List<LocalDate> previous = occurrencesByCriterion.getOrDefault(item.getCriterionId(), List.of());
            RiskAssessment risk = riskAssessor.assess(item.getBaseImpact(), previous, today, rules);
            RiskBand level = risk.band();

            Finding finding = new Finding();
            finding.setInspectionId(inspection.getId());
            finding.setInspectionItemId(item.getId());
            finding.setRestaurantId(inspection.getRestaurantId());
            finding.setCriterionId(item.getCriterionId());
            finding.setBaseImpact(item.getBaseImpact());
            finding.setEffectiveImpact((short) risk.effectiveImpact());
            finding.setViolationCount(risk.frequency());
            finding.setCalculatedScore(risk.score());
            finding.setRiskLevelCode(level.code());
            finding.setRiskLevelName(level.name());
            finding.setRemediationDays(level.remediationDays());
            finding.setDeadlineDate(today.plusDays(level.remediationDays()));
            finding.setStatus(FindingStatus.OPEN);
            finding.setDescription(item.getComment());
            finding.setEvidenceUrls(item.getEvidenceUrls());

            Finding saved = findingRepository.save(finding);
            createdFindings.add(saved);
            criterionNamesByFindingId.put(saved.getId(), item.getCriterionName());
            eventsToSave.add(new FindingEvent(saved.getId(), FindingEventAction.CREATED, null,
                    FindingStatus.OPEN, user.id(), null, now));
        }

        if (!eventsToSave.isEmpty()) {
            eventRepository.saveAll(eventsToSave);
        }

        inspection.setSubmittedAt(now);
        if (StringUtils.hasText(req.notes())) {
            inspection.setNotes(req.notes().trim());
        }
        if (hasFail) {
            inspection.setStatus(InspectionStatus.SUBMITTED);
        } else {
            inspection.setStatus(InspectionStatus.AWAITING_ACK);
        }

        InspectionResponse res = queryService.toResponse(inspectionRepository.saveAndFlush(inspection));
        eventPublisher.publishEvent(new InspectionSubmittedEvent(
                res.id(), res.code(), res.restaurantId(), res.restaurantName(), res.inspectorId(), failedSubs.size()
        ));
        for (Finding f : createdFindings) {
            if ("M4".equalsIgnoreCase(f.getRiskLevelCode())) {
                eventPublisher.publishEvent(new FindingM4AlertEvent(
                        f.getId(), res.id(), res.restaurantId(), res.restaurantName(),
                        criterionNamesByFindingId.getOrDefault(f.getId(), "Tiêu chí #" + f.getCriterionId()),
                        f.getCalculatedScore()
                ));
            }
        }
        return res;
    }

    @Transactional
    public InspectionResponse acknowledge(Long id, CurrentUser user) {
        Inspection inspection = queryService.load(id);
        access.requireStoreManager(inspection.getRestaurantId(), user);
        if (inspection.getStatus() != InspectionStatus.AWAITING_ACK) {
            throw new BusinessException(ErrorCode.INSPECTION_INVALID_STATE,
                    "Chỉ xác nhận đã xem được phiếu không có lỗi đang chờ Cửa hàng trưởng xác nhận");
        }
        Instant now = clock.instant();
        inspection.setAcknowledgedBy(user.id());
        inspection.setAcknowledgedAt(now);
        inspection.setStatus(InspectionStatus.COMPLETED);
        inspection.setCompletedAt(now);
        return queryService.toResponse(inspectionRepository.saveAndFlush(inspection));
    }

    private Map<Long, InspectionSubmitItemRequest> validateSubmission(Inspection inspection, InspectionSubmitRequest req) {
        Map<Long, InspectionItem> items = new HashMap<>();
        inspection.getItems().forEach(it -> items.put(it.getCriterionId(), it));

        Map<Long, InspectionSubmitItemRequest> submitMap = new HashMap<>();
        for (InspectionSubmitItemRequest sub : req.items()) {
            InspectionItem item = items.get(sub.criterionId());
            if (item == null) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Tiêu chí #%d không thuộc phiếu chấm này".formatted(sub.criterionId()));
            }
            if (submitMap.putIfAbsent(sub.criterionId(), sub) != null) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Tiêu chí '%s' bị gửi trùng".formatted(item.getCriterionName()));
            }
            if (sub.result() == ItemResult.UNRATED) {
                throw new BusinessException(ErrorCode.INSPECTION_INCOMPLETE,
                        "Tiêu chí '%s' chưa được chấm".formatted(item.getCriterionName()));
            }
            if (sub.result() == ItemResult.FAIL && !StringUtils.hasText(sub.comment())) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Tiêu chí '%s' không đạt bắt buộc phải ghi mô tả lỗi".formatted(item.getCriterionName()));
            }
            if (sub.result() == ItemResult.FAIL && !StringUtils.hasText(sub.evidenceUrls())) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Tiêu chí '%s' không đạt bắt buộc có ít nhất 1 ảnh/video bằng chứng".formatted(item.getCriterionName()));
            }
            if (sub.result() == ItemResult.NA && !StringUtils.hasText(sub.comment())) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Tiêu chí '%s' chọn N/A bắt buộc ghi lý do".formatted(item.getCriterionName()));
            }
        }

        List<String> missing = items.values().stream()
                .filter(it -> !submitMap.containsKey(it.getCriterionId()))
                .sorted(Comparator.comparingInt(InspectionItem::getSortOrder))
                .map(InspectionItem::getCriterionName)
                .toList();
        if (!missing.isEmpty()) {
            throw new BusinessException(ErrorCode.INSPECTION_INCOMPLETE,
                    "Còn %d tiêu chí chưa chấm: %s".formatted(missing.size(), String.join(", ", missing)));
        }
        return submitMap;
    }

    private static String trimToNull(String s) {
        return StringUtils.hasText(s) ? s.trim() : null;
    }

    @Transactional
    public InspectionResponse cancel(Long id, InspectionCancelRequest req, CurrentUser user) {
        Inspection inspection = queryService.load(id);
        if (inspection.getStatus() != InspectionStatus.ASSIGNED && inspection.getStatus() != InspectionStatus.IN_PROGRESS) {
            throw new BusinessException(ErrorCode.INSPECTION_INVALID_STATE, "Chỉ huỷ được phiếu chưa gửi kết quả");
        }
        inspection.setStatus(InspectionStatus.CANCELLED);
        inspection.setCancelReason(req.reason().trim());
        Inspection saved = inspectionRepository.saveAndFlush(inspection);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                    user != null ? user.id() : null,
                    user != null ? user.username() : null,
                    null,
                    "INSPECTION_CANCEL",
                    "INSPECTION",
                    saved.getCode(),
                    "Huỷ phiếu kiểm tra " + saved.getCode() + ": " + req.reason().trim(),
                    req.reason().trim()
            ));
        }
        return queryService.toResponse(saved);
    }
}

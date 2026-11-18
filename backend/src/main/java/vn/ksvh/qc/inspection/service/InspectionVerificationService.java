package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.inspection.api.event.InspectionSubmittedEvent;
import vn.ksvh.qc.inspection.domain.*;
import vn.ksvh.qc.inspection.dto.InspectionResponse;
import vn.ksvh.qc.inspection.dto.InspectionSubmitItemRequest;
import vn.ksvh.qc.inspection.dto.InspectionSubmitRequest;
import vn.ksvh.qc.media.api.EvidenceApi;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;

import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InspectionVerificationService {

    private final InspectionRepository inspectionRepository;
    private final FindingRepository findingRepository;
    private final EvidenceApi evidenceApi;
    private final FindingService findingService;
    private final InspectionQueryService queryService;
    private final Clock clock;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public InspectionResponse submitVerification(Inspection inspection, InspectionSubmitRequest req, CurrentUser user) {
        Map<Long, InspectionSubmitItemRequest> submitByItem = new HashMap<>();
        Map<Long, InspectionSubmitItemRequest> submitByCriterion = new HashMap<>();
        for (InspectionSubmitItemRequest sub : req.items()) {
            if (sub.itemId() != null) {
                submitByItem.put(sub.itemId(), sub);
            }
            submitByCriterion.put(sub.criterionId(), sub);
        }

        Instant now = clock.instant();
        int failedCount = 0;

        for (InspectionItem item : inspection.getItems()) {
            InspectionSubmitItemRequest sub = submitByItem.get(item.getId());
            if (sub == null) {
                sub = submitByCriterion.get(item.getCriterionId());
            }
            if (sub == null) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Thiếu kết quả nghiệm thu cho tiêu chí '" + item.getCriterionName() + "'");
            }
            if (sub.result() != ItemResult.PASS && sub.result() != ItemResult.FAIL) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Kết quả nghiệm thu phải là Đạt (PASS) hoặc Không đạt (FAIL)");
            }

            String evidence = evidenceApi.requireUploaded(sub.evidenceUrls(), user.id());
            item.setResult(sub.result());
            item.setComment(StringUtils.hasText(sub.comment()) ? sub.comment().trim() : null);
            item.setEvidenceUrls(evidence);
            item.setEvaluatedAt(now);

            boolean passed = sub.result() == ItemResult.PASS;
            if (!passed) {
                failedCount++;
            }

            if (item.getFindingId() != null) {
                Finding f = findingRepository.findById(item.getFindingId()).orElse(null);
                if (f != null) {
                    findingService.verifyInternal(f, passed, item.getComment(), user.id(), user.username());
                }
            }
        }

        inspection.setSubmittedAt(now);
        inspection.setCompletedAt(now);
        inspection.setStatus(InspectionStatus.COMPLETED);
        if (StringUtils.hasText(req.notes())) {
            inspection.setNotes(req.notes().trim());
        }

        InspectionResponse res = queryService.toResponse(inspectionRepository.saveAndFlush(inspection));
        eventPublisher.publishEvent(new InspectionSubmittedEvent(
                res.id(), res.code(), res.restaurantId(), res.restaurantName(), res.inspectorId(), failedCount
        ));
        return res;
    }
}

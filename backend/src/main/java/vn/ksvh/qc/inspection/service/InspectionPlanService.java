package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.inspection.domain.InspectionPlan;
import vn.ksvh.qc.inspection.domain.InspectionPlanRepository;
import vn.ksvh.qc.inspection.domain.PlanStatus;
import vn.ksvh.qc.inspection.dto.PlanCreateRequest;
import vn.ksvh.qc.inspection.dto.PlanRejectRequest;
import vn.ksvh.qc.inspection.dto.PlanResponse;
import vn.ksvh.qc.inspection.dto.PlanUpdateRequest;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.NotFoundException;
import vn.ksvh.qc.shared.web.PageResponse;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InspectionPlanService {

    private final Clock clock;
    private final InspectionPlanRepository planRepository;
    private final UserAccountApi userAccountApi;

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

        return PageResponse.of(page, p -> {
            String createdByName = p.getCreatedBy() != null && users.containsKey(p.getCreatedBy())
                    ? users.get(p.getCreatedBy()).fullName() : null;
            String approvedByName = p.getApprovedBy() != null && users.containsKey(p.getApprovedBy())
                    ? users.get(p.getApprovedBy()).fullName() : null;
            return PlanResponse.from(p, createdByName, approvedByName);
        });
    }

    public PlanResponse get(Long id) {
        InspectionPlan p = load(id);
        var users = userAccountApi.findSummaries(Stream.of(p.getCreatedBy(), p.getApprovedBy()).filter(Objects::nonNull).toList());
        String createdByName = p.getCreatedBy() != null && users.containsKey(p.getCreatedBy()) ? users.get(p.getCreatedBy()).fullName() : null;
        String approvedByName = p.getApprovedBy() != null && users.containsKey(p.getApprovedBy()) ? users.get(p.getApprovedBy()).fullName() : null;
        return PlanResponse.from(p, createdByName, approvedByName);
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

        return get(planRepository.saveAndFlush(p).getId());
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

        return get(planRepository.saveAndFlush(p).getId());
    }

    @Transactional
    public PlanResponse submit(Long id, Long actorId) {
        InspectionPlan p = load(id);
        if (p.getStatus() != PlanStatus.DRAFT && p.getStatus() != PlanStatus.REJECTED) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Kế hoạch không ở trạng thái có thể gửi duyệt");
        }
        p.setStatus(PlanStatus.PENDING_APPROVAL);
        p.setRejectionReason(null);
        return get(planRepository.saveAndFlush(p).getId());
    }

    @Transactional
    public PlanResponse approve(Long id, Long actorId) {
        InspectionPlan p = load(id);
        if (p.getStatus() != PlanStatus.PENDING_APPROVAL) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Chỉ có thể duyệt kế hoạch đang chờ duyệt");
        }
        p.setStatus(PlanStatus.APPROVED);
        p.setApprovedBy(actorId);
        p.setApprovedAt(clock.instant());
        p.setRejectionReason(null);
        return get(planRepository.saveAndFlush(p).getId());
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
        return get(planRepository.saveAndFlush(p).getId());
    }

    @Transactional
    public void delete(Long id) {
        InspectionPlan p = load(id);
        if (p.getStatus() != PlanStatus.DRAFT && p.getStatus() != PlanStatus.REJECTED) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Chỉ có thể xoá kế hoạch ở trạng thái Bản nháp hoặc Bị từ chối");
        }
        planRepository.delete(p);
    }

    private InspectionPlan load(Long id) {
        return planRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy kế hoạch #" + id));
    }
}

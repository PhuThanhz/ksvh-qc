package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.criteria.api.CriteriaLookupApi;
import vn.ksvh.qc.criteria.api.CriterionRef;
import vn.ksvh.qc.criteria.api.TemplateRef;
import vn.ksvh.qc.inspection.api.event.InspectionAssignedEvent;
import vn.ksvh.qc.inspection.domain.*;
import vn.ksvh.qc.inspection.dto.InspectionBatchCreateRequest;
import vn.ksvh.qc.inspection.dto.InspectionResponse;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.NotFoundException;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InspectionBatchCreationService {

    private final InspectionRepository inspectionRepository;
    private final InspectionPlanRepository planRepository;
    private final CriteriaLookupApi criteriaLookupApi;
    private final OrgUnitLookupApi orgUnitLookupApi;
    private final InspectionQueryService queryService;
    private final InspectionCreationService creationService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public List<InspectionResponse> createBatch(InspectionBatchCreateRequest req, CurrentUser user) {
        if (!user.has(PermissionCodes.PLAN_CREATE) && !Objects.equals(req.inspectorId(), user.id())) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "Bạn chỉ được tạo phiếu chấm cho chính mình");
        }
        if (req.inspectionType() == InspectionKind.VERIFICATION) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Phiếu kiểm tra kết quả khắc phục chỉ được tạo đơn lẻ cho từng nhà hàng");
        }
        InspectionCreationService.requirePlanForPeriodic(req.inspectionType(), req.planId());
        if (req.planId() != null) {
            InspectionPlan plan = planRepository.findById(req.planId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy kế hoạch #" + req.planId()));
            if (plan.getStatus() != PlanStatus.APPROVED) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Kế hoạch '%s' chưa được phê duyệt (trạng thái: %s)".formatted(plan.getTitle(), plan.getStatus()));
            }
        }
        List<Long> restaurantIds = req.restaurantIds().stream().filter(Objects::nonNull).distinct().toList();
        if (restaurantIds.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Vui lòng chọn ít nhất một nhà hàng");
        }

        Map<Long, OrgUnitRef> restaurants = orgUnitLookupApi.findRefs(restaurantIds);
        for (Long rId : restaurantIds) {
            OrgUnitRef r = restaurants.get(rId);
            if (r == null || !"RESTAURANT".equals(r.unitType()) || !r.active()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Nhà hàng #" + rId + " không tồn tại hoặc đã ngừng hoạt động");
            }
        }

        InspectionKind kind = req.inspectionType();
        InspectionMode mode = req.inspectionMode() != null ? req.inspectionMode() : InspectionMode.ON_SITE;
        List<CriterionRef> criteria;
        Long templateId = null;
        List<Long> topics = List.of();

        if (kind == InspectionKind.PERIODIC) {
            if (mode != InspectionMode.ON_SITE) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Kiểm tra định kỳ tháng phải thực hiện thực tế tại nhà hàng");
            }
            if (req.templateId() == null) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Kiểm tra định kỳ phải chọn mẫu phiếu chấm");
            }
            TemplateRef template = criteriaLookupApi.findTemplate(req.templateId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy mẫu phiếu #" + req.templateId()));
            for (Long rId : restaurantIds) {
                InspectionCreationService.validateTemplateForRestaurant(template, restaurants.get(rId));
            }
            if (template.items().isEmpty()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Mẫu phiếu này không còn tiêu chí nào đang hoạt động");
            }
            templateId = template.id();
            criteria = template.items();
        } else {
            topics = req.topicGroupIds() == null ? List.of() : req.topicGroupIds().stream().filter(Objects::nonNull).distinct().toList();
            if (topics.isEmpty()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Kiểm tra đột xuất phải chọn ít nhất một chuyên đề (nhóm tiêu chí)");
            }
            for (Long rId : restaurantIds) {
                creationService.validateTopics(topics, restaurants.get(rId));
            }
            criteria = criteriaLookupApi.findActiveCriteriaInGroups(topics);
            if (criteria.isEmpty()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Các chuyên đề đã chọn chưa có tiêu chí nào đang hoạt động");
            }
        }

        String prefix = req.codePrefix().trim().toUpperCase(Locale.ROOT);
        List<Inspection> createdList = new ArrayList<>();
        Set<String> allocatedCodes = new HashSet<>();

        for (Long rId : restaurantIds) {
            OrgUnitRef rest = restaurants.get(rId);
            String storeCode = StringUtils.hasText(rest.code()) ? rest.code().trim().toUpperCase(Locale.ROOT) : ("R" + rest.id());
            String candidateCode = prefix + "-" + storeCode;
            int suffix = 1;
            while (allocatedCodes.contains(candidateCode) || inspectionRepository.existsByCodeIgnoreCase(candidateCode)) {
                candidateCode = prefix + "-" + storeCode + "-" + suffix++;
            }
            allocatedCodes.add(candidateCode);

            Inspection inspection = new Inspection();
            inspection.setCode(candidateCode);
            inspection.setPlanId(req.planId());
            inspection.setRestaurantId(rId);
            inspection.setTemplateId(templateId);
            inspection.setInspectorId(req.inspectorId());
            inspection.setInspectionType(kind);
            inspection.setInspectionMode(mode);
            inspection.getTopicGroupIds().addAll(topics);
            inspection.setNotes(StringUtils.hasText(req.notes()) ? req.notes().trim() : null);
            inspection.setStatus(InspectionStatus.ASSIGNED);
            inspection.setCreatedBy(user.id());

            int order = 1;
            for (CriterionRef c : criteria) {
                InspectionItem item = new InspectionItem();
                item.setInspection(inspection);
                item.setCriterionId(c.id());
                item.setCriterionCode(c.code());
                item.setCriterionName(c.name());
                item.setGroupName(c.groupName());
                item.setBaseImpact((short) c.baseImpact());
                item.setSortOrder(order++);
                item.setResult(ItemResult.UNRATED);
                inspection.getItems().add(item);
            }
            createdList.add(inspection);
        }

        try {
            inspectionRepository.saveAllAndFlush(createdList);
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Lỗi trùng lặp mã phiếu hoặc dữ liệu không hợp lệ trong đợt tạo hàng loạt");
        }

        var inspectorMap = queryService.lookupInspectors(List.of(req.inspectorId()));
        String insName = inspectorMap.containsKey(req.inspectorId()) ? inspectorMap.get(req.inspectorId()).fullName() : null;
        var tplMap = templateId != null ? criteriaLookupApi.findTemplates(List.of(templateId)) : Map.<Long, TemplateRef>of();
        String tplName = templateId != null && tplMap.containsKey(templateId) ? tplMap.get(templateId).name() : null;
        var topicGroupMap = topics.isEmpty() ? Map.<Long, vn.ksvh.qc.criteria.api.CriterionGroupRef>of() : criteriaLookupApi.findGroups(topics);
        List<String> topicNames = topics.stream()
                .map(topicGroupMap::get)
                .filter(Objects::nonNull)
                .map(vn.ksvh.qc.criteria.api.CriterionGroupRef::name)
                .toList();

        List<InspectionResponse> responses = createdList.stream().map(ins -> {
            OrgUnitRef r = restaurants.get(ins.getRestaurantId());
            return InspectionResponse.from(ins, r != null ? r.name() : null, tplName, insName, 0, null, topicNames, true);
        }).toList();
        for (InspectionResponse res : responses) {
            eventPublisher.publishEvent(new InspectionAssignedEvent(
                    res.id(), res.code(), res.restaurantId(), res.restaurantName(), res.inspectorId(), res.inspectionType().name()
            ));
        }
        return responses;
    }
}

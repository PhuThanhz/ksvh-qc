package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.criteria.api.CriteriaLookupApi;
import vn.ksvh.qc.criteria.api.CriterionGroupRef;
import vn.ksvh.qc.criteria.api.TemplateRef;
import vn.ksvh.qc.inspection.domain.*;
import vn.ksvh.qc.inspection.dto.InspectionItemResponse;
import vn.ksvh.qc.inspection.dto.InspectionResponse;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.shared.error.NotFoundException;
import vn.ksvh.qc.shared.web.PageResponse;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InspectionQueryService {

    private final InspectionRepository inspectionRepository;
    private final InspectionItemRepository inspectionItemRepository;
    private final FindingRepository findingRepository;
    private final CriteriaLookupApi criteriaLookupApi;
    private final OrgUnitLookupApi orgUnitLookupApi;
    private final UserAccountApi userAccountApi;
    private final InspectionAccess access;

    public PageResponse<InspectionResponse> search(String keyword, Long restaurantId, Long inspectorId,
                                                  InspectionStatus status, Pageable pageable, CurrentUser user) {
        Specification<Inspection> spec = Specification.unrestricted();
        Specification<Inspection> scope = access.inspectionScope(user);
        if (scope != null) {
            spec = spec.and(scope);
        }
        if (StringUtils.hasText(keyword)) {
            String kw = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("code")), kw),
                    cb.like(cb.lower(root.get("inspectionType")), kw)
            ));
        }
        if (restaurantId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("restaurantId"), restaurantId));
        }
        if (inspectorId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("inspectorId"), inspectorId));
        }
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }

        var page = inspectionRepository.findAll(spec, pageable);

        var restaurantIds = page.getContent().stream().map(Inspection::getRestaurantId).distinct().toList();
        var inspectorIds = page.getContent().stream().map(Inspection::getInspectorId).distinct().toList();
        var templateIds = page.getContent().stream().map(Inspection::getTemplateId).distinct().toList();
        var inspectionIds = page.getContent().stream().map(Inspection::getId).toList();
        var allTopicGroupIds = page.getContent().stream()
                .flatMap(ins -> ins.getTopicGroupIds().stream())
                .distinct()
                .toList();

        Map<Long, OrgUnitRef> restaurants = orgUnitLookupApi.findRefs(restaurantIds);
        Map<Long, UserSummary> inspectors = userAccountApi.findSummaries(inspectorIds);
        Map<Long, TemplateRef> templates = criteriaLookupApi.findTemplates(templateIds);
        Map<Long, CriterionGroupRef> topicGroups = criteriaLookupApi.findGroups(allTopicGroupIds);

        Map<Long, Integer> riskScoreMap = new HashMap<>();
        Map<Long, String> maxRiskMap = new HashMap<>();
        Map<Long, int[]> itemSummaryMap = new HashMap<>();
        if (!inspectionIds.isEmpty()) {
            for (Object[] row : findingRepository.findRiskSummariesByInspectionIds(inspectionIds)) {
                Long insId = ((Number) row[0]).longValue();
                int sumScore = ((Number) row[1]).intValue();
                String maxCode = (String) row[2];
                riskScoreMap.put(insId, sumScore);
                maxRiskMap.put(insId, maxCode);
            }
            for (Object[] row : inspectionItemRepository.summarizeByInspectionIds(inspectionIds)) {
                Long insId = ((Number) row[0]).longValue();
                itemSummaryMap.put(insId, new int[]{
                        row[1] != null ? ((Number) row[1]).intValue() : 0,
                        row[2] != null ? ((Number) row[2]).intValue() : 0,
                        row[3] != null ? ((Number) row[3]).intValue() : 0,
                        row[4] != null ? ((Number) row[4]).intValue() : 0,
                        row[5] != null ? ((Number) row[5]).intValue() : 0,
                        row[6] != null ? ((Number) row[6]).intValue() : 0
                });
            }
        }

        return PageResponse.of(page, i -> {
            String rName = restaurants.containsKey(i.getRestaurantId()) ? restaurants.get(i.getRestaurantId()).name() : null;
            String tName = i.getTemplateId() != null && templates.containsKey(i.getTemplateId()) ? templates.get(i.getTemplateId()).name() : null;
            String insName = inspectors.containsKey(i.getInspectorId()) ? inspectors.get(i.getInspectorId()).fullName() : null;
            int totalRisk = riskScoreMap.getOrDefault(i.getId(), 0);
            String maxRisk = maxRiskMap.get(i.getId());
            List<String> tNames = i.getTopicGroupIds().stream()
                    .map(topicGroups::get)
                    .filter(Objects::nonNull)
                    .map(CriterionGroupRef::name)
                    .toList();
            int[] s = itemSummaryMap.getOrDefault(i.getId(), new int[6]);
            return InspectionResponse.fromSummary(i, rName, tName, insName, totalRisk, maxRisk, tNames,
                    s[0], s[1], s[2], s[3], s[4], s[5]);
        });
    }

    public List<InspectionResponse> listMyInspections(Long inspectorId) {
        List<Inspection> list = inspectionRepository.findByInspectorIdAndStatusIn(
                inspectorId,
                List.of(InspectionStatus.ASSIGNED, InspectionStatus.IN_PROGRESS)
        );
        var restaurantIds = list.stream().map(Inspection::getRestaurantId).distinct().toList();
        var templateIds = list.stream().map(Inspection::getTemplateId).distinct().toList();
        var inspectionIds = list.stream().map(Inspection::getId).toList();
        var allTopicGroupIds = list.stream()
                .flatMap(ins -> ins.getTopicGroupIds().stream())
                .distinct()
                .toList();

        Map<Long, OrgUnitRef> restaurants = orgUnitLookupApi.findRefs(restaurantIds);
        Map<Long, TemplateRef> templates = criteriaLookupApi.findTemplates(templateIds);
        Map<Long, UserSummary> inspectors = userAccountApi.findSummaries(List.of(inspectorId));
        Map<Long, CriterionGroupRef> topicGroups = criteriaLookupApi.findGroups(allTopicGroupIds);
        String insName = inspectors.containsKey(inspectorId) ? inspectors.get(inspectorId).fullName() : null;

        Map<Long, int[]> itemSummaryMap = new HashMap<>();
        if (!inspectionIds.isEmpty()) {
            for (Object[] row : inspectionItemRepository.summarizeByInspectionIds(inspectionIds)) {
                Long insId = ((Number) row[0]).longValue();
                itemSummaryMap.put(insId, new int[]{
                        row[1] != null ? ((Number) row[1]).intValue() : 0,
                        row[2] != null ? ((Number) row[2]).intValue() : 0,
                        row[3] != null ? ((Number) row[3]).intValue() : 0,
                        row[4] != null ? ((Number) row[4]).intValue() : 0,
                        row[5] != null ? ((Number) row[5]).intValue() : 0,
                        row[6] != null ? ((Number) row[6]).intValue() : 0
                });
            }
        }

        return list.stream().map(i -> {
            String rName = restaurants.containsKey(i.getRestaurantId()) ? restaurants.get(i.getRestaurantId()).name() : null;
            String tName = i.getTemplateId() != null && templates.containsKey(i.getTemplateId()) ? templates.get(i.getTemplateId()).name() : null;
            List<String> tNames = i.getTopicGroupIds().stream()
                    .map(topicGroups::get)
                    .filter(Objects::nonNull)
                    .map(CriterionGroupRef::name)
                    .toList();
            int[] s = itemSummaryMap.getOrDefault(i.getId(), new int[6]);
            return InspectionResponse.fromSummary(i, rName, tName, insName, 0, null, tNames,
                    s[0], s[1], s[2], s[3], s[4], s[5]);
        }).toList();
    }

    public InspectionResponse get(Long id, CurrentUser user) {
        Inspection i = load(id);
        access.requireRead(i, user);
        return toResponse(i);
    }

    public InspectionResponse toResponse(Inspection i) {
        Long id = i.getId();
        var rest = orgUnitLookupApi.findRefs(List.of(i.getRestaurantId())).get(i.getRestaurantId());
        var ins = userAccountApi.findSummaries(List.of(i.getInspectorId())).get(i.getInspectorId());
        var tpl = i.getTemplateId() == null ? null : criteriaLookupApi.findTemplate(i.getTemplateId()).orElse(null);
        Map<Long, CriterionGroupRef> topicGroups = criteriaLookupApi.findGroups(i.getTopicGroupIds());
        List<String> topicNames = i.getTopicGroupIds().stream().map(topicGroups::get).filter(Objects::nonNull).map(CriterionGroupRef::name).toList();

        List<Finding> allFindings = findingRepository.findByInspectionId(id);
        Set<Long> dismissedItemIds = allFindings.stream()
                .filter(f -> f.getStatus() == FindingStatus.DISMISSED)
                .map(Finding::getInspectionItemId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        List<Finding> findings = allFindings.stream()
                .filter(f -> f.getStatus() != FindingStatus.DISMISSED)
                .toList();
        int totalRisk = findings.stream().mapToInt(Finding::getCalculatedScore).sum();
        String maxRisk = findings.stream()
                .map(Finding::getRiskLevelCode)
                .max(Comparator.naturalOrder())
                .orElse(null);

        return InspectionResponse.from(i,
                rest != null ? rest.name() : null,
                tpl != null ? tpl.name() : null,
                ins != null ? ins.fullName() : null,
                totalRisk,
                maxRisk,
                topicNames,
                true,
                dismissedItemIds
        );
    }

    public List<InspectionItemResponse> listItems(Long id, CurrentUser user) {
        Inspection inspection = load(id);
        access.requireRead(inspection, user);
        List<Finding> findings = findingRepository.findByInspectionId(id);
        Map<Long, Finding> byItemId = findings.stream()
                .filter(f -> f.getInspectionItemId() != null)
                .collect(Collectors.toMap(Finding::getInspectionItemId, Function.identity(), (a, b) -> a));

        List<Long> explicitFindingIds = inspection.getItems().stream()
                .map(InspectionItem::getFindingId)
                .filter(Objects::nonNull)
                .toList();
        Map<Long, Finding> byFindingId = explicitFindingIds.isEmpty() ? Map.of()
                : findingRepository.findAllById(explicitFindingIds).stream()
                .collect(Collectors.toMap(Finding::getId, Function.identity()));

        return inspection.getItems().stream()
                .map(item -> {
                    Finding f = item.getFindingId() != null ? byFindingId.get(item.getFindingId()) : byItemId.get(item.getId());
                    return InspectionItemResponse.from(item, f);
                })
                .toList();
    }

    public Inspection load(Long id) {
        return inspectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu chấm #" + id));
    }

    public Map<Long, UserSummary> lookupInspectors(Collection<Long> ids) {
        return userAccountApi.findSummaries(ids);
    }
}

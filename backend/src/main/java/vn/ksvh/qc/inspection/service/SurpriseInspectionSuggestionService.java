package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.criteria.api.CriteriaLookupApi;
import vn.ksvh.qc.criteria.api.CriterionGroupRef;
import vn.ksvh.qc.criteria.api.CriterionRef;
import vn.ksvh.qc.inspection.domain.Finding;
import vn.ksvh.qc.inspection.domain.FindingRepository;
import vn.ksvh.qc.inspection.domain.FindingStatus;
import vn.ksvh.qc.inspection.dto.SurpriseInspectionSuggestion;
import vn.ksvh.qc.organization.api.CompanyLookupApi;
import vn.ksvh.qc.organization.api.CompanyRef;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.security.CurrentUser;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SurpriseInspectionSuggestionService {

    private final FindingRepository findingRepository;
    private final OrgUnitLookupApi orgUnitLookupApi;
    private final CompanyLookupApi companyLookupApi;
    private final CriteriaLookupApi criteriaLookupApi;

    private static final Set<FindingStatus> ACTIVE_FINDING_STATUSES = EnumSet.of(
            FindingStatus.OPEN,
            FindingStatus.CONFIRMED,
            FindingStatus.APPEALED,
            FindingStatus.APPEAL_MEETING,
            FindingStatus.REMEDIATING,
            FindingStatus.PENDING_VERIFICATION
    );

    public List<SurpriseInspectionSuggestion> getSuggestions(CurrentUser user) {
        List<Finding> activeFindings = findingRepository.findByStatusIn(ACTIVE_FINDING_STATUSES);
        if (activeFindings.isEmpty()) {
            return List.of();
        }

        Map<Long, List<Finding>> byRestaurant = activeFindings.stream()
                .collect(Collectors.groupingBy(Finding::getRestaurantId));

        Set<Long> restIds = byRestaurant.keySet();
        Map<Long, OrgUnitRef> restMap = orgUnitLookupApi.findRefs(restIds);

        Set<Long> companyIds = restMap.values().stream()
                .map(OrgUnitRef::companyId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, CompanyRef> companyMap = companyLookupApi.findRefs(companyIds);

        Set<Long> critIds = activeFindings.stream().map(Finding::getCriterionId).collect(Collectors.toSet());
        Map<Long, CriterionRef> critMap = criteriaLookupApi.findCriteria(critIds);

        Set<Long> groupIds = critMap.values().stream()
                .map(CriterionRef::groupId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, CriterionGroupRef> groupMap = criteriaLookupApi.findGroups(groupIds);

        List<SurpriseInspectionSuggestion> results = new ArrayList<>();

        for (Map.Entry<Long, List<Finding>> entry : byRestaurant.entrySet()) {
            Long rId = entry.getKey();
            List<Finding> findings = entry.getValue();
            OrgUnitRef rest = restMap.get(rId);
            if (rest == null || !rest.active() || !"RESTAURANT".equals(rest.unitType())) {
                continue;
            }

            int m4Count = 0;
            int m3Count = 0;
            int totalRiskScore = 0;
            String highestRiskLevel = "M1";
            int escalatedCount = 0;

            Set<Long> suggestedGroups = new LinkedHashSet<>();

            for (Finding f : findings) {
                totalRiskScore += f.getCalculatedScore();
                String code = f.getRiskLevelCode();
                if ("M4".equalsIgnoreCase(code)) {
                    m4Count++;
                    highestRiskLevel = "M4";
                } else if ("M3".equalsIgnoreCase(code)) {
                    m3Count++;
                    if (!"M4".equalsIgnoreCase(highestRiskLevel)) {
                        highestRiskLevel = "M3";
                    }
                } else if ("M2".equalsIgnoreCase(code) && !"M4".equalsIgnoreCase(highestRiskLevel) && !"M3".equalsIgnoreCase(highestRiskLevel)) {
                    highestRiskLevel = "M2";
                }

                if (f.getEffectiveImpact() > f.getBaseImpact()) {
                    escalatedCount++;
                }

                CriterionRef crit = critMap.get(f.getCriterionId());
                if (crit != null && crit.groupId() != null) {
                    suggestedGroups.add(crit.groupId());
                }
            }

            boolean qualify = m4Count > 0 || m3Count > 0 || totalRiskScore >= 8 || findings.size() >= 3 || escalatedCount > 0;
            if (!qualify) {
                continue;
            }

            String primaryReason;
            if (m4Count > 0) {
                primaryReason = "Có " + m4Count + " lỗi đặc biệt nghiêm trọng (M4) chưa hoàn tất khắc phục";
            } else if (m3Count >= 2) {
                primaryReason = "Có " + m3Count + " lỗi nghiêm trọng (M3) đang mở";
            } else if (m3Count == 1) {
                primaryReason = "Có 1 lỗi nghiêm trọng (M3) chưa nghiệm thu";
            } else if (totalRiskScore >= 12) {
                primaryReason = "Điểm rủi ro tích luỹ cao (" + totalRiskScore + " điểm)";
            } else if (escalatedCount > 0) {
                primaryReason = "Có " + escalatedCount + " tiêu chí bị nâng mức ảnh hưởng do tái phạm";
            } else {
                primaryReason = "Có " + findings.size() + " lỗi vi phạm đang trong quá trình khắc phục";
            }

            List<Long> groupList = new ArrayList<>(suggestedGroups);
            List<String> groupNames = groupList.stream()
                    .map(groupMap::get)
                    .filter(Objects::nonNull)
                    .map(CriterionGroupRef::name)
                    .toList();

            CompanyRef parentCompany = rest.companyId() != null ? companyMap.get(rest.companyId()) : null;

            results.add(new SurpriseInspectionSuggestion(
                    rId,
                    rest.code(),
                    rest.name(),
                    rest.companyId(),
                    parentCompany != null ? parentCompany.name() : null,
                    totalRiskScore,
                    highestRiskLevel,
                    m4Count,
                    m3Count,
                    findings.size(),
                    escalatedCount,
                    primaryReason,
                    groupList,
                    groupNames
            ));
        }

        results.sort((a, b) -> {
            if (a.m4Count() != b.m4Count()) return Integer.compare(b.m4Count(), a.m4Count());
            if (a.m3Count() != b.m3Count()) return Integer.compare(b.m3Count(), a.m3Count());
            if (a.totalRiskScore() != b.totalRiskScore()) return Integer.compare(b.totalRiskScore(), a.totalRiskScore());
            return Integer.compare(b.openFindingCount(), a.openFindingCount());
        });

        return results;
    }
}

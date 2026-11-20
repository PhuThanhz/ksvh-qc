package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.criteria.api.CriteriaLookupApi;
import vn.ksvh.qc.criteria.api.CriterionRef;
import vn.ksvh.qc.criteria.api.RiskConfigRef;
import vn.ksvh.qc.inspection.domain.*;
import vn.ksvh.qc.inspection.dto.*;
import vn.ksvh.qc.organization.api.CompanyLookupApi;
import vn.ksvh.qc.organization.api.CompanyRef;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.risk.CurrentCriterionRisk;
import vn.ksvh.qc.risk.RiskRules;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.util.BusinessDates;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.time.Clock;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RestaurantRiskProfileService {

    private final FindingOccurrenceRepository occurrenceRepository;
    private final FindingRepository findingRepository;
    private final CriteriaLookupApi criteriaLookupApi;
    private final OrgUnitLookupApi orgUnitLookupApi;
    private final CompanyLookupApi companyLookupApi;
    private final UserAccountApi userAccountApi;
    private final Clock clock;

    public RestaurantRiskProfileResponse getRestaurantRiskProfile(Long restaurantId, LocalDate asOfDate) {
        OrgUnitRef rest = orgUnitLookupApi.findRefs(List.of(restaurantId)).get(restaurantId);
        if (rest == null || !"RESTAURANT".equals(rest.unitType())) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy nhà hàng #" + restaurantId);
        }

        LocalDate asOf = asOfDate != null ? asOfDate : BusinessDates.today(clock);
        RiskConfigRef config = criteriaLookupApi.riskConfigAt(asOf);
        RiskRules rules = RiskAssessor.rulesFor(rest, config);

        String companyName = null;
        if (rest.companyId() != null) {
            CompanyRef comp = companyLookupApi.findRefs(List.of(rest.companyId())).get(rest.companyId());
            if (comp != null) companyName = comp.name();
        }

        String storeManagerName = null;
        if (rest.storeManagerUserId() != null) {
            UserSummary sm = userAccountApi.findSummaries(List.of(rest.storeManagerUserId())).get(rest.storeManagerUserId());
            if (sm != null) storeManagerName = sm.fullName();
        }

        List<FindingOccurrence> allOccurrences = occurrenceRepository.findByRestaurantIdOrderByOccurredAtDesc(restaurantId);
        Map<Long, List<FindingOccurrence>> occurrencesByCrit = allOccurrences.stream()
                .collect(Collectors.groupingBy(FindingOccurrence::getCriterionId));

        List<Finding> activeFindings = findingRepository.findByRestaurantId(restaurantId).stream()
                .filter(f -> f.getStatus() != FindingStatus.CLOSED && f.getStatus() != FindingStatus.DISMISSED)
                .toList();
        Map<Long, Long> activeCountByCrit = activeFindings.stream()
                .collect(Collectors.groupingBy(Finding::getCriterionId, Collectors.counting()));

        Set<Long> critIds = new LinkedHashSet<>(occurrencesByCrit.keySet());
        activeFindings.forEach(f -> critIds.add(f.getCriterionId()));

        Map<Long, CriterionRef> critMap = criteriaLookupApi.findCriteria(critIds);

        List<CriterionRiskProfileItem> items = new ArrayList<>();
        for (Long critId : critIds) {
            CriterionRef crit = critMap.get(critId);
            if (crit == null) continue;

            List<FindingOccurrence> occList = occurrencesByCrit.getOrDefault(critId, List.of());
            List<LocalDate> occDates = occList.stream()
                    .map(o -> o.getOccurredAt().atZone(BusinessDates.ZONE).toLocalDate())
                    .toList();

            CurrentCriterionRisk risk = rules.evaluateCurrentRisk(crit.baseImpact(), occDates, asOf);

            List<OccurrenceSummary> occSummaries = occList.stream()
                    .map(o -> new OccurrenceSummary(
                            o.getOccurredAt().atZone(BusinessDates.ZONE).toLocalDate(),
                            o.getSource().name(),
                            o.getFindingId()))
                    .toList();

            items.add(new CriterionRiskProfileItem(
                    crit.id(),
                    crit.code(),
                    crit.name(),
                    crit.groupName(),
                    risk.baseImpact(),
                    risk.effectiveImpact(),
                    risk.isEscalated(),
                    risk.frequencyInPeriod(),
                    occList.size(),
                    risk.lastViolationDate(),
                    risk.expectedResetDate(),
                    risk.cleanMonthsCount(),
                    activeCountByCrit.getOrDefault(critId, 0L),
                    occSummaries
            ));
        }

        // Sắp xếp: Tiêu chí đang nâng mức ưu tiên hàng đầu, sau đó theo tần suất trong kỳ giảm dần, rồi ngày vi phạm gần nhất
        items.sort(Comparator.comparing(CriterionRiskProfileItem::isEscalated).reversed()
                .thenComparing(CriterionRiskProfileItem::frequencyInPeriod, Comparator.reverseOrder())
                .thenComparing(CriterionRiskProfileItem::lastViolationDate, Comparator.nullsLast(Comparator.reverseOrder())));

        int totalEscalated = (int) items.stream().filter(CriterionRiskProfileItem::isEscalated).count();
        Integer resetPeriod = rules.escalation() != null ? rules.escalation().resetPeriodMonths() : null;

        return new RestaurantRiskProfileResponse(
                rest.id(),
                rest.code(),
                rest.name(),
                companyName,
                storeManagerName,
                asOf,
                config.periodMonths(),
                asOf.withDayOfMonth(1).minusMonths(config.periodMonths() - 1L),
                rest.escalationThreshold() != null || rest.escalationResetMonths() != null || rest.escalationStep() != null,
                rules.escalation() != null ? rules.escalation().thresholdCount() : null,
                resetPeriod,
                rules.escalation() != null ? rules.escalation().stepIncrease() : null,
                totalEscalated,
                activeFindings.size(),
                items
        );
    }

    public List<EscalatedCriterionSummary> getEscalatedCriteria(LocalDate asOfDate) {
        LocalDate asOf = asOfDate != null ? asOfDate : BusinessDates.today(clock);
        RiskConfigRef config = criteriaLookupApi.riskConfigAt(asOf);
        if (config.escalation() == null) {
            return List.of();
        }

        List<FindingOccurrence> allOccurrences = occurrenceRepository.findAllForMultiViolationPairs();
        if (allOccurrences.isEmpty()) {
            return List.of();
        }
        Map<Long, Map<Long, List<FindingOccurrence>>> byRestAndCrit = allOccurrences.stream()
                .collect(Collectors.groupingBy(FindingOccurrence::getRestaurantId,
                        Collectors.groupingBy(FindingOccurrence::getCriterionId)));

        Set<Long> restIds = byRestAndCrit.keySet();
        Map<Long, OrgUnitRef> restMap = orgUnitLookupApi.findRefs(restIds);

        Set<Long> allCritIds = allOccurrences.stream().map(FindingOccurrence::getCriterionId).collect(Collectors.toSet());
        Map<Long, CriterionRef> critMap = criteriaLookupApi.findCriteria(allCritIds);

        Set<Long> companyIds = restMap.values().stream()
                .map(OrgUnitRef::companyId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, CompanyRef> companyMap = companyLookupApi.findRefs(companyIds);

        List<EscalatedCriterionSummary> result = new ArrayList<>();

        for (Map.Entry<Long, Map<Long, List<FindingOccurrence>>> restEntry : byRestAndCrit.entrySet()) {
            Long restId = restEntry.getKey();
            OrgUnitRef rest = restMap.get(restId);
            if (rest == null) continue;
            RiskRules rules = RiskAssessor.rulesFor(rest, config);
            String companyName = rest.companyId() != null && companyMap.containsKey(rest.companyId())
                    ? companyMap.get(rest.companyId()).name() : null;

            for (Map.Entry<Long, List<FindingOccurrence>> critEntry : restEntry.getValue().entrySet()) {
                Long critId = critEntry.getKey();
                CriterionRef crit = critMap.get(critId);
                if (crit == null) continue;

                List<LocalDate> occDates = critEntry.getValue().stream()
                        .map(o -> o.getOccurredAt().atZone(BusinessDates.ZONE).toLocalDate())
                        .toList();

                CurrentCriterionRisk risk = rules.evaluateCurrentRisk(crit.baseImpact(), occDates, asOf);
                if (risk.isEscalated()) {
                    result.add(new EscalatedCriterionSummary(
                            rest.id(),
                            rest.code(),
                            rest.name(),
                            companyName,
                            crit.id(),
                            crit.code(),
                            crit.name(),
                            crit.groupName(),
                            risk.baseImpact(),
                            risk.effectiveImpact(),
                            risk.frequencyInPeriod(),
                            risk.lastViolationDate(),
                            risk.expectedResetDate(),
                            risk.cleanMonthsCount()
                    ));
                }
            }
        }

        result.sort(Comparator.comparing(EscalatedCriterionSummary::restaurantCode)
                .thenComparing(EscalatedCriterionSummary::criterionCode));

        return result;
    }
}

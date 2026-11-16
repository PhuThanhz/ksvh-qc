package vn.ksvh.qc.criteria.service;

import vn.ksvh.qc.criteria.domain.CriterionGroupRepository;
import vn.ksvh.qc.criteria.domain.CriterionGroup;
import vn.ksvh.qc.criteria.api.CriterionGroupRef;
import vn.ksvh.qc.criteria.domain.EscalationRuleRepository;
import vn.ksvh.qc.criteria.domain.FrequencyConfigRepository;
import vn.ksvh.qc.criteria.api.RiskConfigRef;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.criteria.api.CriteriaLookupApi;
import vn.ksvh.qc.criteria.api.CriterionRef;
import vn.ksvh.qc.criteria.api.RiskLevelRef;
import vn.ksvh.qc.criteria.api.TemplateRef;
import vn.ksvh.qc.shared.util.BusinessDates;
import vn.ksvh.qc.criteria.domain.Criterion;
import vn.ksvh.qc.criteria.domain.CriterionRepository;
import vn.ksvh.qc.criteria.domain.InspectionTemplate;
import vn.ksvh.qc.criteria.domain.InspectionTemplateRepository;
import vn.ksvh.qc.criteria.domain.RiskLevel;
import vn.ksvh.qc.criteria.domain.RiskLevelRepository;

import java.time.Clock;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class CriteriaLookupService implements CriteriaLookupApi {

    private final CriterionRepository criterionRepository;
    private final InspectionTemplateRepository templateRepository;
    private final RiskLevelRepository riskLevelRepository;
    private final CriterionGroupRepository groupRepository;
    private final FrequencyConfigRepository frequencyRepository;
    private final EscalationRuleRepository escalationRepository;
    private final Clock clock;

    @Override
    public Map<Long, CriterionRef> findCriteria(Collection<Long> ids) {
        var distinct = ids.stream().filter(Objects::nonNull).distinct().toList();
        if (distinct.isEmpty()) {
            return Map.of();
        }
        return criterionRepository.findByIdIn(distinct).stream()
                .collect(Collectors.toUnmodifiableMap(
                        Criterion::getId,
                        this::toCriterionRef
                ));
    }

    @Override
    public Map<Long, TemplateRef> findTemplates(Collection<Long> ids) {
        var distinct = ids.stream().filter(Objects::nonNull).distinct().toList();
        if (distinct.isEmpty()) {
            return Map.of();
        }
        return templateRepository.findAllById(distinct).stream()
                .collect(Collectors.toUnmodifiableMap(
                        InspectionTemplate::getId,
                        t -> new TemplateRef(t.getId(), t.getCode(), t.getName(), t.isActive(),
                                t.getCompanyId(), List.of())
                ));
    }

    @Override
    public Optional<TemplateRef> findTemplate(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        return templateRepository.findById(id).map(t -> {
            List<Long> critIds = templateRepository.findCriterionIdsByTemplateId(t.getId());
            Map<Long, Criterion> cMap = criterionRepository.findByIdIn(critIds).stream()
                    .collect(Collectors.toMap(Criterion::getId, Function.identity()));
            List<CriterionRef> items = critIds.stream()
                    .map(cMap::get)
                    .filter(Objects::nonNull)
                    // Tiêu chí (hoặc nhóm) đã ngưng không đưa vào phiếu mới.
                    .filter(c -> c.isActive() && c.getGroup() != null && c.getGroup().isActive())
                    .map(this::toCriterionRef)
                    .toList();
            return new TemplateRef(t.getId(), t.getCode(), t.getName(), t.isActive(),
                    t.getCompanyId(), items);
        });
    }

    @Override
    public List<RiskLevelRef> listRiskLevels() {
        return riskLevelRepository.findEffectiveAt(BusinessDates.today(clock)).stream()
                .map(r -> new RiskLevelRef(
                        r.getId(),
                        r.getCode(),
                        r.getName(),
                        r.getMinScore(),
                        r.getMaxScore(),
                        r.getRemediationDays(),
                        r.getAction()
                ))
                .toList();
    }

    private CriterionRef toCriterionRef(Criterion c) {
        return new CriterionRef(
                c.getId(),
                c.getCode(),
                c.getName(),
                c.getGroup() != null ? c.getGroup().getName() : null,
                c.getBaseImpact(),
                c.isActive()
        );
    }

    /** Chưa khai báo kỳ đếm → mặc định 6 tháng (giá trị ví dụ trong tài liệu nghiệp vụ). */
    @Override
    public RiskConfigRef riskConfigAt(LocalDate date) {
        int period = frequencyRepository.findFirstByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(date)
                .map(f -> (int) f.getPeriodMonths()).orElse(6);
        RiskConfigRef.Escalation escalation = escalationRepository.findFirstByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(date)
                .map(r -> new RiskConfigRef.Escalation(r.getThresholdCount(), r.getStepIncrease(), r.getMaxImpact(), r.getResetPeriodMonths()))
                .orElse(null);
        List<RiskLevelRef> levels = riskLevelRepository.findEffectiveAt(date).stream()
                .map(r -> new RiskLevelRef(r.getId(), r.getCode(), r.getName(), r.getMinScore(), r.getMaxScore(),
                        r.getRemediationDays(), r.getAction()))
                .toList();
        return new RiskConfigRef(date, period, escalation, levels);
    }

    @Override
    public Map<Long, CriterionGroupRef> findGroups(Collection<Long> ids) {
        var distinct = ids.stream().filter(Objects::nonNull).distinct().toList();
        if (distinct.isEmpty()) {
            return Map.of();
        }
        return groupRepository.findAllById(distinct).stream().collect(Collectors.toUnmodifiableMap(
                CriterionGroup::getId,
                g -> new CriterionGroupRef(g.getId(), g.getCode(), g.getName(), g.getCompanyId(), g.isActive())));
    }

    @Override
    public List<CriterionRef> findActiveCriteriaInGroups(Collection<Long> groupIds) {
        var ids = groupIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
        return criterionRepository.findActiveOrdered().stream()
                .filter(c -> ids.contains(c.getGroup().getId()))
                .map(this::toCriterionRef)
                .toList();
    }
}

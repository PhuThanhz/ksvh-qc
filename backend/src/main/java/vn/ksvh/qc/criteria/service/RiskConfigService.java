package vn.ksvh.qc.criteria.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.shared.config.CacheConfig;
import vn.ksvh.qc.criteria.domain.EscalationRule;
import vn.ksvh.qc.criteria.domain.EscalationRuleRepository;
import vn.ksvh.qc.criteria.domain.FrequencyConfig;
import vn.ksvh.qc.criteria.domain.FrequencyConfigRepository;
import vn.ksvh.qc.criteria.domain.RiskLevel;
import vn.ksvh.qc.criteria.domain.RiskLevelRepository;
import vn.ksvh.qc.criteria.dto.ConfigStatus;
import vn.ksvh.qc.criteria.dto.EscalationRuleRequest;
import vn.ksvh.qc.criteria.dto.EscalationRuleResponse;
import vn.ksvh.qc.criteria.dto.FrequencyConfigRequest;
import vn.ksvh.qc.criteria.dto.FrequencyConfigResponse;
import vn.ksvh.qc.criteria.dto.RiskLevelItem;
import vn.ksvh.qc.criteria.dto.RiskLevelVersionRequest;
import vn.ksvh.qc.criteria.dto.RiskLevelVersionResponse;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.NotFoundException;
import vn.ksvh.qc.shared.util.BusinessDates;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Danh mục 7–9: phân loại rủi ro, cấu hình tần suất, quy tắc nâng mức ảnh hưởng.
 * Tần suất và nâng mức là phiên bản theo ngày hiệu lực: chỉ tạo mới (từ hôm nay trở đi), không sửa;
 * xoá được bản chưa tới ngày hiệu lực. Nhờ vậy kết quả tính rủi ro trong quá khứ không bị đổi.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RiskConfigService {


    private final RiskLevelRepository riskLevelRepository;
    private final FrequencyConfigRepository frequencyRepository;
    private final EscalationRuleRepository escalationRepository;
    private final UserAccountApi users;
    private final Clock clock;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    // ---- Phân loại rủi ro ----

    /** Bộ mức rủi ro đang áp dụng hôm nay. */
    @Cacheable(CacheConfig.RISK_LEVELS)
    public List<RiskLevelItem> riskLevels() {
        return riskLevelRepository.findEffectiveAt(BusinessDates.today(clock)).stream().map(RiskLevelItem::from).toList();
    }

    /** Mọi phiên bản, mới nhất trước. */
    @Cacheable(value = CacheConfig.RISK_LEVELS, key = "'versions'")
    public List<RiskLevelVersionResponse> riskLevelVersions() {
        Map<LocalDate, List<RiskLevel>> byDate = riskLevelRepository.findAllByOrderByEffectiveFromDescMinScoreAsc().stream()
                .collect(Collectors.groupingBy(RiskLevel::getEffectiveFrom, LinkedHashMap::new, Collectors.toList()));
        List<LocalDate> dates = List.copyOf(byDate.keySet());
        List<ConfigStatus> statuses = statuses(dates);
        Map<Long, UserSummary> editors = users.findSummaries(byDate.values().stream().flatMap(List::stream)
                .map(RiskLevel::getUpdatedBy).filter(Objects::nonNull).distinct().toList());
        List<RiskLevelVersionResponse> result = new ArrayList<>();
        for (int i = 0; i < dates.size(); i++) {
            result.add(toVersion(byDate.get(dates.get(i)), statuses.get(i), editors));
        }
        return result;
    }

    /**
     * Tạo (hoặc thay) phiên bản áp dụng từ ngày effectiveFrom. Ngày phải từ hôm nay trở đi nên phiên bản
     * đã có hiệu lực từ trước không bao giờ bị sửa. Lỗi đã sinh lưu bản sao mức rủi ro nên không bị ảnh hưởng.
     * Các khoảng phải bắt đầu từ 0, liền nhau, không chồng; mức cuối không giới hạn trên.
     */
    @Transactional
    @CacheEvict(value = {CacheConfig.RISK_LEVELS, CacheConfig.RISK_CONFIG_AT}, allEntries = true)
    public RiskLevelVersionResponse saveRiskLevelVersion(RiskLevelVersionRequest req, Long actorId) {
        LocalDate date = req.effectiveFrom();
        if (date.isBefore(BusinessDates.today(clock))) {
            throw new BusinessException(ErrorCode.CONFIG_EFFECTIVE_DATE_INVALID,
                    "Ngày hiệu lực phải từ hôm nay trở đi (không áp dụng ngược quá khứ)");
        }
        List<RiskLevelItem> levels = req.levels().stream().sorted(Comparator.comparing(RiskLevelItem::minScore)).toList();
        validateLevels(levels);
        List<RiskLevel> previous = riskLevelRepository.findEffectiveAt(date.minusDays(1));
        if (!previous.isEmpty() && sameLevels(levels, previous)) {
            throw unchanged("bảng phân loại rủi ro", previous.getFirst().getEffectiveFrom());
        }

        riskLevelRepository.deleteAll(riskLevelRepository.findByEffectiveFromOrderByMinScoreAsc(date));
        riskLevelRepository.flush();
        List<RiskLevel> toSave = new ArrayList<>();
        for (int i = 0; i < levels.size(); i++) {
            RiskLevelItem item = levels.get(i);
            RiskLevel r = new RiskLevel();
            r.setCode(item.code());
            r.setName(item.name().trim());
            r.setMinScore(item.minScore());
            r.setMaxScore(item.maxScore());
            r.setRemediationDays(item.remediationDays());
            r.setAction(StringUtils.hasText(item.action()) ? item.action().trim() : null);
            r.setEffectiveFrom(date);
            r.setSortOrder(i + 1);
            r.setUpdatedBy(actorId);
            toSave.add(r);
        }
        riskLevelRepository.saveAllAndFlush(toSave);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                    actorId, "RISK_CONFIG_UPDATE", "RISK_LEVEL", date.toString(),
                    "Cập nhật bảng phân loại mức rủi ro hiệu lực từ ngày " + date
            ));
        }
        return riskLevelVersions().stream().filter(v -> v.effectiveFrom().equals(date)).findFirst().orElseThrow();
    }

    /** Chỉ xoá được phiên bản chưa đến ngày hiệu lực. */
    @Transactional
    @CacheEvict(value = {CacheConfig.RISK_LEVELS, CacheConfig.RISK_CONFIG_AT}, allEntries = true)
    public void deleteRiskLevelVersion(LocalDate effectiveFrom) {
        List<RiskLevel> version = riskLevelRepository.findByEffectiveFromOrderByMinScoreAsc(effectiveFrom);
        if (version.isEmpty()) {
            throw new NotFoundException("Không có phiên bản phân loại rủi ro hiệu lực từ ngày " + effectiveFrom);
        }
        assertScheduled(effectiveFrom);
        riskLevelRepository.deleteAll(version);
    }

    private static RiskLevelVersionResponse toVersion(List<RiskLevel> rows, ConfigStatus status, Map<Long, UserSummary> editors) {
        RiskLevel latest = rows.stream()
                .max(Comparator.comparing(RiskLevel::getUpdatedAt, Comparator.nullsFirst(Comparator.naturalOrder())))
                .orElseThrow();
        return new RiskLevelVersionResponse(rows.getFirst().getEffectiveFrom(), status, latest.getUpdatedAt(),
                name(editors, latest.getUpdatedBy()), rows.stream().map(RiskLevelItem::from).toList());
    }

    private static void validateLevels(List<RiskLevelItem> levels) {
        if (levels.isEmpty()) {
            throw invalid("Phải có ít nhất một mức rủi ro");
        }
        Set<String> codes = levels.stream().map(RiskLevelItem::code).collect(Collectors.toSet());
        if (codes.size() != levels.size()) {
            throw invalid("Mã mức rủi ro bị trùng");
        }
        if (levels.getFirst().minScore().compareTo(BigDecimal.ZERO) != 0) {
            throw invalid("Mức thấp nhất phải bắt đầu từ 0 điểm");
        }
        for (int i = 0; i < levels.size(); i++) {
            RiskLevelItem cur = levels.get(i);
            boolean last = i == levels.size() - 1;
            if (last) {
                if (cur.maxScore() != null) {
                    throw invalid("Mức cao nhất (%s) không có giới hạn trên, để trống ô \"đến\"".formatted(cur.code()));
                }
                continue;
            }
            RiskLevelItem next = levels.get(i + 1);
            if (cur.maxScore() == null || cur.maxScore().compareTo(cur.minScore()) <= 0) {
                throw invalid("Mức %s: điểm \"đến\" phải lớn hơn điểm \"từ\"".formatted(cur.code()));
            }
            if (cur.maxScore().compareTo(next.minScore()) != 0) {
                throw invalid("Khoảng điểm phải liền nhau: %s kết thúc ở %s nhưng %s bắt đầu từ %s"
                        .formatted(cur.code(), cur.maxScore().stripTrailingZeros().toPlainString(),
                                next.code(), next.minScore().stripTrailingZeros().toPlainString()));
            }
        }
    }

    private static BusinessException invalid(String message) {
        return new BusinessException(ErrorCode.RISK_LEVELS_INVALID, message);
    }

    // ---- Tần suất ----

    @Cacheable(CacheConfig.FREQUENCY_CONFIG)
    public List<FrequencyConfigResponse> frequencyConfigs() {
        List<FrequencyConfig> all = frequencyRepository.findAllByOrderByEffectiveFromDesc();
        Map<Long, UserSummary> creators = users.findSummaries(all.stream().map(FrequencyConfig::getCreatedBy).toList());
        List<ConfigStatus> statuses = statuses(all.stream().map(FrequencyConfig::getEffectiveFrom).toList());
        List<FrequencyConfigResponse> result = new ArrayList<>();
        for (int i = 0; i < all.size(); i++) {
            FrequencyConfig c = all.get(i);
            result.add(FrequencyConfigResponse.from(c, statuses.get(i), name(creators, c.getCreatedBy())));
        }
        return result;
    }

    @Transactional
    @CacheEvict(value = {CacheConfig.FREQUENCY_CONFIG, CacheConfig.RISK_CONFIG_AT}, allEntries = true)
    public FrequencyConfigResponse createFrequency(FrequencyConfigRequest req, Long actorId) {
        assertNewEffectiveDate(req.effectiveFrom(), frequencyRepository.existsByEffectiveFrom(req.effectiveFrom()));
        var previous = frequencyRepository.findFirstByEffectiveFromLessThanOrderByEffectiveFromDesc(req.effectiveFrom());
        if (previous.isPresent() && previous.get().getPeriodMonths() == req.periodMonths()) {
            throw unchanged("cấu hình tần suất", previous.get().getEffectiveFrom());
        }
        FrequencyConfig c = new FrequencyConfig();
        c.setPeriodMonths(req.periodMonths().shortValue());
        c.setEffectiveFrom(req.effectiveFrom());
        c.setNote(StringUtils.hasText(req.note()) ? req.note().trim() : null);
        c.setCreatedBy(actorId);
        frequencyRepository.saveAndFlush(c);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                    actorId, "RISK_CONFIG_UPDATE", "FREQUENCY_CONFIG", req.effectiveFrom().toString(),
                    "Tạo phiên bản cấu hình tần suất (" + req.periodMonths() + " tháng) hiệu lực từ ngày " + req.effectiveFrom()
            ));
        }
        return frequencyConfigs().stream().filter(r -> r.id().equals(c.getId())).findFirst().orElseThrow();
    }

    @Transactional
    @CacheEvict(value = {CacheConfig.FREQUENCY_CONFIG, CacheConfig.RISK_CONFIG_AT}, allEntries = true)
    public void deleteFrequency(Long id) {
        FrequencyConfig c = frequencyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy cấu hình tần suất #" + id));
        assertScheduled(c.getEffectiveFrom());
        frequencyRepository.delete(c);
    }

    // ---- Nâng mức ảnh hưởng ----

    @Cacheable(CacheConfig.ESCALATION_RULES)
    public List<EscalationRuleResponse> escalationRules() {
        List<EscalationRule> all = escalationRepository.findAllByOrderByEffectiveFromDesc();
        Map<Long, UserSummary> creators = users.findSummaries(all.stream().map(EscalationRule::getCreatedBy).toList());
        List<ConfigStatus> statuses = statuses(all.stream().map(EscalationRule::getEffectiveFrom).toList());
        List<EscalationRuleResponse> result = new ArrayList<>();
        for (int i = 0; i < all.size(); i++) {
            EscalationRule r = all.get(i);
            result.add(EscalationRuleResponse.from(r, statuses.get(i), name(creators, r.getCreatedBy())));
        }
        return result;
    }

    @Transactional
    @CacheEvict(value = {CacheConfig.ESCALATION_RULES, CacheConfig.RISK_CONFIG_AT}, allEntries = true)
    public EscalationRuleResponse createEscalation(EscalationRuleRequest req, Long actorId) {
        assertNewEffectiveDate(req.effectiveFrom(), escalationRepository.existsByEffectiveFrom(req.effectiveFrom()));
        var previous = escalationRepository.findFirstByEffectiveFromLessThanOrderByEffectiveFromDesc(req.effectiveFrom());
        if (previous.isPresent()
                && previous.get().getThresholdCount() == req.thresholdCount()
                && previous.get().getStepIncrease() == req.stepIncrease()
                && previous.get().getMaxImpact() == req.maxImpact()
                && previous.get().getResetPeriodMonths() == req.resetPeriodMonths()) {
            throw unchanged("quy tắc nâng mức", previous.get().getEffectiveFrom());
        }
        EscalationRule r = new EscalationRule();
        r.setThresholdCount(req.thresholdCount().shortValue());
        r.setStepIncrease(req.stepIncrease().shortValue());
        r.setMaxImpact(req.maxImpact().shortValue());
        r.setResetPeriodMonths(req.resetPeriodMonths().shortValue());
        r.setEffectiveFrom(req.effectiveFrom());
        r.setNote(StringUtils.hasText(req.note()) ? req.note().trim() : null);
        r.setCreatedBy(actorId);
        escalationRepository.saveAndFlush(r);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                    actorId, "RISK_CONFIG_UPDATE", "ESCALATION_RULE", req.effectiveFrom().toString(),
                    "Tạo phiên bản quy tắc nâng mức ảnh hưởng (ngưỡng " + req.thresholdCount() + " lần, tăng +" + req.stepIncrease() + ") hiệu lực từ ngày " + req.effectiveFrom()
            ));
        }
        return escalationRules().stream().filter(x -> x.id().equals(r.getId())).findFirst().orElseThrow();
    }

    @Transactional
    @CacheEvict(value = {CacheConfig.ESCALATION_RULES, CacheConfig.RISK_CONFIG_AT}, allEntries = true)
    public void deleteEscalation(Long id) {
        EscalationRule r = escalationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy quy tắc nâng mức #" + id));
        assertScheduled(r.getEffectiveFrom());
        escalationRepository.delete(r);
    }

    // ---- dùng chung ----

    /** Phiên bản mới giống hệt bản có hiệu lực ngay trước nó → tạo ra cũng không đổi gì, nên chặn. */
    private static BusinessException unchanged(String what, LocalDate previousDate) {
        return new BusinessException(ErrorCode.CONFIG_UNCHANGED, "Phiên bản mới giống hệt " + what
                + " đang hiệu lực từ " + previousDate.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                + ". Hãy thay đổi ít nhất một giá trị.");
    }

    private static boolean sameLevels(List<RiskLevelItem> levels, List<RiskLevel> previous) {
        if (levels.size() != previous.size()) {
            return false;
        }
        for (int i = 0; i < levels.size(); i++) {
            RiskLevelItem a = levels.get(i);
            RiskLevel b = previous.get(i);
            boolean same = a.code().equals(b.getCode())
                    && a.name().trim().equals(b.getName())
                    && a.minScore().compareTo(b.getMinScore()) == 0
                    && (a.maxScore() == null ? b.getMaxScore() == null
                        : b.getMaxScore() != null && a.maxScore().compareTo(b.getMaxScore()) == 0)
                    && a.remediationDays().equals(b.getRemediationDays())
                    && Objects.equals(StringUtils.hasText(a.action()) ? a.action().trim() : null, b.getAction());
            if (!same) {
                return false;
            }
        }
        return true;
    }

    /** dates sắp giảm dần: bản đầu tiên có ngày ≤ hôm nay là CURRENT, sau đó PAST; ngày > hôm nay là SCHEDULED. */
    private List<ConfigStatus> statuses(List<LocalDate> datesDesc) {
        LocalDate today = BusinessDates.today(clock);
        List<ConfigStatus> result = new ArrayList<>();
        boolean currentFound = false;
        for (LocalDate d : datesDesc) {
            if (d.isAfter(today)) {
                result.add(ConfigStatus.SCHEDULED);
            } else if (!currentFound) {
                result.add(ConfigStatus.CURRENT);
                currentFound = true;
            } else {
                result.add(ConfigStatus.PAST);
            }
        }
        return result;
    }

    private void assertNewEffectiveDate(LocalDate date, boolean exists) {
        if (date.isBefore(BusinessDates.today(clock))) {
            throw new BusinessException(ErrorCode.CONFIG_EFFECTIVE_DATE_INVALID,
                    "Ngày hiệu lực phải từ hôm nay trở đi (không áp dụng ngược quá khứ)");
        }
        if (exists) {
            throw new BusinessException(ErrorCode.CONFIG_EFFECTIVE_DATE_INVALID,
                    "Đã có phiên bản hiệu lực từ ngày %s".formatted(date));
        }
    }

    private void assertScheduled(LocalDate effectiveFrom) {
        if (!effectiveFrom.isAfter(BusinessDates.today(clock))) {
            throw new BusinessException(ErrorCode.CONFIG_ALREADY_EFFECTIVE,
                    "Phiên bản đã có hiệu lực, không thể xoá; hãy tạo phiên bản mới");
        }
    }

    private static String name(Map<Long, UserSummary> users, Long id) {
        UserSummary u = id == null ? null : users.get(id);
        return u == null ? null : u.fullName();
    }
}

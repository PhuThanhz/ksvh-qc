package vn.ksvh.qc.criteria.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.shared.config.CacheConfig;
import vn.ksvh.qc.criteria.domain.Criterion;
import vn.ksvh.qc.criteria.domain.CriterionGroup;
import vn.ksvh.qc.criteria.domain.CriterionGroupRepository;
import vn.ksvh.qc.criteria.domain.CriterionRepository;
import vn.ksvh.qc.criteria.domain.InspectionTemplate;
import vn.ksvh.qc.criteria.domain.InspectionTemplateRepository;
import vn.ksvh.qc.criteria.domain.TemplateItem;
import vn.ksvh.qc.criteria.dto.CriterionGroupRequest;
import vn.ksvh.qc.criteria.dto.CriterionGroupResponse;
import vn.ksvh.qc.criteria.dto.CriterionRequest;
import vn.ksvh.qc.criteria.dto.CriterionResponse;
import vn.ksvh.qc.organization.api.CompanyLookupApi;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.NotFoundException;
import vn.ksvh.qc.shared.web.PageResponse;
import vn.ksvh.qc.shared.web.Pageables;

import java.util.*;
import java.util.stream.Collectors;

/** Nhóm tiêu chí và tiêu chí. Không xoá: ngưng hoạt động để giữ lịch sử chấm. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CriterionService {

    /** Trường được phép sắp xếp ở danh sách tiêu chí. */
    public static final Set<String> SORTABLE = Set.of("code", "name", "sortOrder", "baseImpact", "createdAt");

    private final CriterionGroupRepository groupRepository;
    private final CriterionRepository criterionRepository;
    private final InspectionTemplateRepository templateRepository;
    private final CompanyLookupApi companyLookupApi;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    // ---- Nhóm ----

    @Cacheable(value = CacheConfig.CRITERIA_GROUPS, key = "#companyId != null ? #companyId : 'all'")
    public List<CriterionGroupResponse> listGroups(Long companyId) {
        Map<Long, Long> counts = groupRepository.countCriteriaByGroup().stream()
                .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
        List<CriterionGroup> list = groupRepository.findAllByOrderBySortOrderAscIdAsc();
        if (companyId != null) {
            list = list.stream()
                    .filter(g -> g.getCompanyId() == null || Objects.equals(g.getCompanyId(), companyId))
                    .toList();
        }
        var companyIds = list.stream().map(CriterionGroup::getCompanyId).filter(Objects::nonNull).toList();
        var companyRefs = companyLookupApi.findRefs(companyIds);
        return list.stream()
                .map(g -> {
                    String cName = g.getCompanyId() != null && companyRefs.containsKey(g.getCompanyId())
                            ? companyRefs.get(g.getCompanyId()).name() : null;
                    return CriterionGroupResponse.from(g, counts.getOrDefault(g.getId(), 0L), cName);
                })
                .toList();
    }

    public List<CriterionGroupResponse> listGroups() {
        return listGroups(null);
    }

    @Transactional
    @CacheEvict(value = CacheConfig.CRITERIA_GROUPS, allEntries = true)
    public CriterionGroupResponse createGroup(CriterionGroupRequest req, Long actorId) {
        String code = req.code().trim();
        if (groupRepository.existsByCodeIgnoreCase(code)) {
            throw codeTaken("nhóm", code);
        }
        CriterionGroup g = new CriterionGroup();
        applyGroup(g, req, code, actorId);
        CriterionGroup saved = groupRepository.saveAndFlush(g);
        String cName = resolveCompanyName(saved.getCompanyId());
        if (eventPublisher != null) {
            eventPublisher.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                    actorId, "CRITERION_GROUP_CREATE", "CRITERION_GROUP", saved.getCode(),
                    "Tạo nhóm tiêu chí " + saved.getName() + " (" + saved.getCode() + ")"
            ));
        }
        return CriterionGroupResponse.from(saved, 0, cName);
    }

    @Transactional
    @CacheEvict(value = CacheConfig.CRITERIA_GROUPS, allEntries = true)
    public CriterionGroupResponse updateGroup(Long id, CriterionGroupRequest req, Long actorId) {
        CriterionGroup g = loadGroup(id);
        String code = req.code().trim();
        if (groupRepository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
            throw codeTaken("nhóm", code);
        }
        if (req.companyId() != null && !Objects.equals(req.companyId(), g.getCompanyId())) {
            List<String> conflicts = templateRepository.findTemplateCodesOutsideCompanyByGroup(id, req.companyId());
            if (!conflicts.isEmpty()) {
                throw new BusinessException(ErrorCode.CRITERIA_INVALID_REFERENCE,
                        "Không thể gán nhóm cho một công ty: tiêu chí của nhóm đang nằm trong mẫu phiếu dùng chung hoặc của công ty khác (%s)"
                                .formatted(String.join(", ", conflicts)));
            }
        }
        applyGroup(g, req, code, actorId);
        long count = criterionRepository.count((root, q, cb) -> cb.equal(root.get("group").get("id"), id));
        CriterionGroup saved = groupRepository.saveAndFlush(g);
        String cName = resolveCompanyName(saved.getCompanyId());
        if (eventPublisher != null) {
            eventPublisher.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                    actorId, "CRITERION_GROUP_UPDATE", "CRITERION_GROUP", saved.getCode(),
                    "Cập nhật nhóm tiêu chí " + saved.getName() + " (" + saved.getCode() + ")"
            ));
        }
        return CriterionGroupResponse.from(saved, count, cName);
    }

    private String resolveCompanyName(Long companyId) {
        if (companyId == null) return null;
        var refs = companyLookupApi.findRefs(List.of(companyId));
        return refs.containsKey(companyId) ? refs.get(companyId).name() : null;
    }

    private static void applyGroup(CriterionGroup g, CriterionGroupRequest req, String code, Long actorId) {
        g.setCode(code);
        g.setName(req.name().trim());
        g.setSortOrder(req.sortOrder());
        g.setCompanyId(req.companyId());
        g.setActive(req.active());
        g.setUpdatedBy(actorId);
    }

    // ---- Tiêu chí ----

    public PageResponse<CriterionResponse> search(
            String keyword,
            Long groupId,
            Long templateId,
            Boolean assignedToTemplate,
            Boolean active,
            Pageable pageable) {
        Pageable safe = Pageables.restrictSort(pageable, SORTABLE);
        Specification<Criterion> spec = Specification.unrestricted();
        if (StringUtils.hasText(keyword)) {
            String kw = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("code")), kw),
                    cb.like(cb.lower(root.get("name")), kw)));
        }
        if (groupId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("group").get("id"), groupId));
        }
        if (templateId != null) {
            List<Long> idsInTemplate = templateRepository.findCriterionIdsByTemplateId(templateId);
            if (idsInTemplate.isEmpty()) {
                return PageResponse.empty(safe);
            }
            spec = spec.and((root, q, cb) -> root.get("id").in(idsInTemplate));
        }
        if (assignedToTemplate != null) {
            List<Long> allAssignedIds = templateRepository.findAllAssignedCriterionIds();
            if (assignedToTemplate) {
                if (allAssignedIds.isEmpty()) return PageResponse.empty(safe);
                spec = spec.and((root, q, cb) -> root.get("id").in(allAssignedIds));
            } else {
                if (!allAssignedIds.isEmpty()) {
                    spec = spec.and((root, q, cb) -> cb.not(root.get("id").in(allAssignedIds)));
                }
            }
        }
        if (active != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("active"), active));
        }

        Page<Criterion> page = criterionRepository.findAll(spec, safe);
        List<Long> criterionIds = page.getContent().stream().map(Criterion::getId).toList();
        Map<Long, List<CriterionResponse.CriterionTemplateRef>> templateMap = new HashMap<>();
        if (!criterionIds.isEmpty()) {
            for (Object[] r : templateRepository.findTemplateRefsByCriterionIds(criterionIds)) {
                Long cid = (Long) r[0];
                Long tid = (Long) r[1];
                String tcode = (String) r[2];
                String tname = (String) r[3];
                templateMap.computeIfAbsent(cid, k -> new ArrayList<>())
                        .add(new CriterionResponse.CriterionTemplateRef(tid, tcode, tname));
            }
        }

        return PageResponse.of(page, c -> CriterionResponse.from(c, templateMap.getOrDefault(c.getId(), List.of())));
    }

    /** Toàn bộ tiêu chí đang hoạt động (nhóm cũng đang hoạt động), đã sắp xếp. Dùng chọn vào mẫu phiếu. */
    public List<CriterionResponse> activeOptions() {
        return criterionRepository.findActiveOrdered().stream().map(CriterionResponse::from).toList();
    }

    public CriterionResponse get(Long id) {
        Criterion c = loadCriterion(id);
        List<CriterionResponse.CriterionTemplateRef> templates = templateRepository.findTemplateRefsByCriterionId(id).stream()
                .map(r -> new CriterionResponse.CriterionTemplateRef((Long) r[1], (String) r[2], (String) r[3]))
                .toList();
        return CriterionResponse.from(c, templates);
    }

    @Transactional
    @CacheEvict(value = CacheConfig.CRITERIA_GROUPS, allEntries = true)
    public CriterionResponse create(CriterionRequest req, Long actorId) {
        String code = req.code().trim();
        if (criterionRepository.existsByCodeIgnoreCase(code)) {
            throw codeTaken("tiêu chí", code);
        }
        Criterion c = new Criterion();
        applyCriterion(c, req, code, actorId);
        Criterion saved = criterionRepository.saveAndFlush(c);
        if (req.templateIds() != null) {
            syncTemplateCriteria(saved, req.templateIds(), actorId);
        }
        if (eventPublisher != null) {
            eventPublisher.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                    actorId, "CRITERION_CREATE", "CRITERION", saved.getCode(),
                    "Tạo tiêu chí " + saved.getName() + " (" + saved.getCode() + ", ảnh hưởng=" + saved.getBaseImpact() + ")"
            ));
        }
        return get(saved.getId());
    }

    @Transactional
    public List<CriterionResponse> createBatch(List<CriterionRequest> requests, Long actorId) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }
        List<CriterionResponse> result = new ArrayList<>(requests.size());
        for (CriterionRequest req : requests) {
            result.add(create(req, actorId));
        }
        return result;
    }

    @Transactional
    @CacheEvict(value = CacheConfig.CRITERIA_GROUPS, allEntries = true)
    public CriterionResponse update(Long id, CriterionRequest req, Long actorId) {
        Criterion c = loadCriterion(id);
        String code = req.code().trim();
        if (criterionRepository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
            throw codeTaken("tiêu chí", code);
        }
        Long oldGroupId = c.getGroup().getId();
        applyCriterion(c, req, code, actorId);
        // Chuyển sang nhóm của một công ty: tiêu chí không được còn nằm trong mẫu dùng chung / của công ty khác.
        Long newCompany = c.getGroup().getCompanyId();
        if (!Objects.equals(oldGroupId, c.getGroup().getId()) && newCompany != null) {
            List<String> conflicts = templateRepository.findTemplateCodesOutsideCompanyByCriterion(id, newCompany);
            if (!conflicts.isEmpty()) {
                throw new BusinessException(ErrorCode.CRITERIA_INVALID_REFERENCE,
                        "Nhóm mới thuộc công ty khác với mẫu phiếu đang chứa tiêu chí này (%s)".formatted(String.join(", ", conflicts)));
            }
        }
        Criterion saved = criterionRepository.saveAndFlush(c);
        if (req.templateIds() != null) {
            syncTemplateCriteria(saved, req.templateIds(), actorId);
        }
        if (eventPublisher != null) {
            eventPublisher.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                    actorId, "CRITERION_CREATE", "CRITERION", saved.getCode(),
                    "Tạo tiêu chí " + saved.getName() + " (" + saved.getCode() + ", ảnh hưởng=" + saved.getBaseImpact() + ")"
            ));
        }
        return get(saved.getId());
    }

    /**
     * Chỉ xoá được tiêu chí nhập nhầm, chưa dùng ở đâu. Đã nằm trong mẫu hoặc đã có phiếu chấm
     * → chuyển sang "ngưng hoạt động" để giữ lịch sử.
     */
    @Transactional
    @CacheEvict(value = CacheConfig.CRITERIA_GROUPS, allEntries = true)
    public void deleteCriterion(Long id) {
        Criterion c = loadCriterion(id);
        List<String> templates = templateRepository.findTemplateRefsByCriterionId(id).stream()
                .map(r -> (String) r[2]).toList();
        if (!templates.isEmpty()) {
            throw new BusinessException(ErrorCode.CRITERIA_IN_USE,
                    "Tiêu chí đang nằm trong mẫu phiếu %s. Hãy gỡ khỏi mẫu, hoặc chuyển sang Ngưng hoạt động"
                            .formatted(String.join(", ", templates)));
        }
        try {
            criterionRepository.delete(c);
            criterionRepository.flush();
            if (eventPublisher != null) {
                eventPublisher.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                        null, "CRITERION_DELETE", "CRITERION", c.getCode(),
                        "Xoá tiêu chí " + c.getName() + " (" + c.getCode() + ")"
                ));
            }
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.CRITERIA_IN_USE,
                    "Tiêu chí đã được dùng trong phiếu chấm, không thể xoá. Hãy chuyển sang Ngưng hoạt động để giữ lịch sử");
        }
    }

    /** Gán tiêu chí vào đúng các mẫu trong danh sách (thêm vào cuối mẫu / gỡ khỏi mẫu không còn chọn). */
    private void syncTemplateCriteria(Criterion criterion, List<Long> targetTemplateIds, Long actorId) {
        Long criterionId = criterion.getId();
        Set<Long> targetSet = new HashSet<>(targetTemplateIds);
        List<Long> currentTemplateIds = templateRepository.findTemplateRefsByCriterionId(criterionId).stream()
                .map(r -> (Long) r[1]).toList();
        Set<Long> toUpdateIds = new HashSet<>(targetSet);
        toUpdateIds.addAll(currentTemplateIds);
        if (toUpdateIds.isEmpty()) return;

        List<InspectionTemplate> templatesToUpdate = templateRepository.findAllById(toUpdateIds);
        Set<Long> foundIds = templatesToUpdate.stream().map(InspectionTemplate::getId).collect(Collectors.toSet());
        Set<Long> missing = targetSet.stream().filter(tid -> !foundIds.contains(tid)).collect(Collectors.toCollection(TreeSet::new));
        if (!missing.isEmpty()) {
            throw new BusinessException(ErrorCode.CRITERIA_INVALID_REFERENCE, "Không tìm thấy mẫu phiếu: " + missing);
        }

        Long groupCompany = criterion.getGroup().getCompanyId();
        boolean usable = criterion.isActive() && criterion.getGroup().isActive();
        for (InspectionTemplate t : templatesToUpdate) {
            boolean contains = t.getItems().stream().anyMatch(item -> item.getCriterionId().equals(criterionId));
            boolean shouldContain = targetSet.contains(t.getId());
            if (contains && !shouldContain) {
                t.getItems().removeIf(item -> item.getCriterionId().equals(criterionId));
                t.setUpdatedBy(actorId);
            } else if (!contains && shouldContain) {
                if (!usable) {
                    throw new BusinessException(ErrorCode.CRITERIA_INVALID_REFERENCE,
                            "Tiêu chí hoặc nhóm đang ngưng hoạt động, không thể thêm vào mẫu '%s'".formatted(t.getName()));
                }
                if (groupCompany != null && !groupCompany.equals(t.getCompanyId())) {
                    throw new BusinessException(ErrorCode.CRITERIA_INVALID_REFERENCE,
                            "Tiêu chí thuộc nhóm riêng của một công ty, không thể thêm vào mẫu '%s' (dùng chung hoặc của công ty khác)"
                                    .formatted(t.getName()));
                }
                int nextOrder = t.getItems().stream().mapToInt(TemplateItem::getSortOrder).max().orElse(0) + 1;
                t.getItems().add(new TemplateItem(criterionId, nextOrder));
                t.setUpdatedBy(actorId);
            }
        }
        templateRepository.saveAll(templatesToUpdate);
    }

    private void applyCriterion(Criterion c, CriterionRequest req, String code, Long actorId) {
        CriterionGroup group = loadGroup(req.groupId());
        boolean groupChanged = c.getGroup() == null || !Objects.equals(c.getGroup().getId(), group.getId());
        if (groupChanged && !group.isActive()) {
            throw new BusinessException(ErrorCode.CRITERIA_INVALID_REFERENCE,
                    "Nhóm '%s' đã ngưng hoạt động, không thể thêm tiêu chí".formatted(group.getName()));
        }
        c.setGroup(group);
        c.setCode(code);
        c.setName(req.name().trim());
        c.setCheckMethod(blankToNull(req.checkMethod()));
        c.setEvidenceRequired(blankToNull(req.evidenceRequired()));
        c.setBaseImpact(req.baseImpact().shortValue());
        c.setSortOrder(req.sortOrder());
        c.setActive(req.active());
        c.setUpdatedBy(actorId);
    }

    private CriterionGroup loadGroup(Long id) {
        return groupRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy nhóm tiêu chí #" + id));
    }

    private Criterion loadCriterion(Long id) {
        return criterionRepository.findWithGroupById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tiêu chí #" + id));
    }

    private static String blankToNull(String s) {
        return StringUtils.hasText(s) ? s.trim() : null;
    }

    private static BusinessException codeTaken(String what, String code) {
        return new BusinessException(ErrorCode.CRITERIA_CODE_TAKEN, "Mã %s '%s' đã tồn tại".formatted(what, code));
    }
}

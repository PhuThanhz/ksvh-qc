package vn.ksvh.qc.criteria.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.criteria.domain.Criterion;
import vn.ksvh.qc.criteria.domain.CriterionRepository;
import vn.ksvh.qc.criteria.domain.InspectionTemplate;
import vn.ksvh.qc.criteria.domain.InspectionTemplateRepository;
import vn.ksvh.qc.criteria.domain.TemplateItem;
import vn.ksvh.qc.criteria.dto.TemplateOption;
import vn.ksvh.qc.criteria.dto.CriterionResponse;
import vn.ksvh.qc.criteria.dto.TemplateRequest;
import vn.ksvh.qc.criteria.dto.TemplateResponse;
import vn.ksvh.qc.organization.api.CompanyLookupApi;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.NotFoundException;
import vn.ksvh.qc.shared.web.PageResponse;
import vn.ksvh.qc.shared.web.Pageables;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Mẫu phiếu chấm. Không xoá: ngưng hoạt động. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TemplateService {

    public static final Set<String> SORTABLE = Set.of("code", "name", "createdAt");

    private final InspectionTemplateRepository templateRepository;
    private final CriterionRepository criterionRepository;
    private final CompanyLookupApi companyLookupApi;

    public PageResponse<TemplateResponse> search(String keyword, Long companyId, Boolean active, Pageable pageable) {
        Pageable safe = Pageables.restrictSort(pageable, SORTABLE);
        Specification<InspectionTemplate> spec = Specification.unrestricted();
        if (StringUtils.hasText(keyword)) {
            String kw = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("code")), kw),
                    cb.like(cb.lower(root.get("name")), kw),
                    cb.like(cb.lower(root.get("inspectionType")), kw)));
        }
        if (companyId != null) {
            spec = spec.and((root, q, cb) -> cb.or(cb.isNull(root.get("companyId")), cb.equal(root.get("companyId"), companyId)));
        }
        if (active != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("active"), active));
        }
        var page = templateRepository.findAll(spec, safe);
        var companyIds = page.getContent().stream().map(InspectionTemplate::getCompanyId).filter(Objects::nonNull).toList();
        var companyRefs = companyLookupApi.findRefs(companyIds);
        return PageResponse.of(page, t -> {
            String cName = t.getCompanyId() != null && companyRefs.containsKey(t.getCompanyId())
                    ? companyRefs.get(t.getCompanyId()).name() : null;
            return TemplateResponse.from(t, List.of(), cName);
        });
    }

    public PageResponse<TemplateResponse> search(String keyword, Boolean active, Pageable pageable) {
        return search(keyword, null, active, pageable);
    }

    /** Mọi mẫu phiếu, sắp theo mã. Dùng cho ô chọn mẫu ở form tiêu chí. */
    public List<TemplateOption> options() {
        return templateRepository.findAll(Sort.by("code")).stream().map(TemplateOption::from).toList();
    }

    public TemplateResponse get(Long id) {
        return toDetail(load(id));
    }

    @Transactional
    public TemplateResponse create(TemplateRequest req, Long actorId) {
        String code = req.code().trim();
        if (templateRepository.existsByCodeIgnoreCase(code)) {
            throw codeTaken(code);
        }
        InspectionTemplate t = new InspectionTemplate();
        apply(t, req, code, actorId);
        return toDetail(templateRepository.saveAndFlush(t));
    }

    @Transactional
    public TemplateResponse update(Long id, TemplateRequest req, Long actorId) {
        InspectionTemplate t = load(id);
        String code = req.code().trim();
        if (templateRepository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
            throw codeTaken(code);
        }
        apply(t, req, code, actorId);
        return toDetail(templateRepository.saveAndFlush(t));
    }

    @Transactional
    public void delete(Long id) {
        InspectionTemplate t = load(id);
        try {
            templateRepository.delete(t);
            templateRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.CRITERIA_IN_USE,
                    "Mẫu phiếu đã được dùng để tạo phiếu chấm, không thể xoá. Hãy chuyển sang Ngưng hoạt động để giữ lịch sử");
        }
    }

    private void apply(InspectionTemplate t, TemplateRequest req, String code, Long actorId) {
        List<Long> ordered = List.copyOf(new LinkedHashSet<>(req.criterionIds()));
        if (ordered.size() != req.criterionIds().size()) {
            throw new BusinessException(ErrorCode.CRITERIA_INVALID_REFERENCE, "Mẫu phiếu có tiêu chí bị lặp");
        }
        Map<Long, Criterion> found = criterionRepository.findByIdIn(ordered).stream()
                .collect(Collectors.toMap(Criterion::getId, Function.identity()));
        Set<Long> already = t.getItems().stream().map(TemplateItem::getCriterionId).collect(Collectors.toSet());
        // Tiêu chí mới thêm phải tồn tại và đang hoạt động; tiêu chí cũ đã ngưng vẫn được giữ trong mẫu.
        Set<Long> invalid = ordered.stream()
                .filter(id -> !found.containsKey(id) || (!already.contains(id) && !found.get(id).isActive()))
                .collect(Collectors.toCollection(TreeSet::new));
        if (!invalid.isEmpty()) {
            throw new BusinessException(ErrorCode.CRITERIA_INVALID_REFERENCE,
                    "Tiêu chí không tồn tại hoặc đã ngưng hoạt động: " + invalid);
        }
        // Tiêu chí thuộc nhóm riêng của một công ty chỉ dùng trong mẫu của đúng công ty đó.
        List<String> wrongCompany = ordered.stream().map(found::get)
                .filter(c -> c.getGroup().getCompanyId() != null && !c.getGroup().getCompanyId().equals(req.companyId()))
                .map(Criterion::getCode)
                .toList();
        if (!wrongCompany.isEmpty()) {
            throw new BusinessException(ErrorCode.CRITERIA_INVALID_REFERENCE,
                    "Tiêu chí thuộc nhóm riêng của công ty khác: " + String.join(", ", wrongCompany));
        }
        t.setCode(code);
        t.setName(req.name().trim());
        t.setCompanyId(req.companyId());
        t.setInspectionType(blankToNull(req.inspectionType()));
        t.setDescription(blankToNull(req.description()));
        t.setActive(req.active());
        t.setUpdatedBy(actorId);
        t.getItems().clear();
        for (int i = 0; i < ordered.size(); i++) {
            t.getItems().add(new TemplateItem(ordered.get(i), i + 1));
        }
    }

    private TemplateResponse toDetail(InspectionTemplate t) {
        List<Long> ids = t.getItems().stream().map(TemplateItem::getCriterionId).toList();
        Map<Long, Criterion> byId = criterionRepository.findByIdIn(ids).stream()
                .collect(Collectors.toMap(Criterion::getId, Function.identity()));
        List<CriterionResponse> criteria = ids.stream().map(byId::get).filter(Objects::nonNull).map(CriterionResponse::from).toList();
        String companyName = null;
        if (t.getCompanyId() != null) {
            var refs = companyLookupApi.findRefs(List.of(t.getCompanyId()));
            if (refs.containsKey(t.getCompanyId())) {
                companyName = refs.get(t.getCompanyId()).name();
            }
        }
        return TemplateResponse.from(t, criteria, companyName);
    }

    private InspectionTemplate load(Long id) {
        return templateRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy mẫu phiếu #" + id));
    }

    private static String blankToNull(String s) {
        return StringUtils.hasText(s) ? s.trim() : null;
    }

    private static BusinessException codeTaken(String code) {
        return new BusinessException(ErrorCode.CRITERIA_CODE_TAKEN, "Mã mẫu phiếu '%s' đã tồn tại".formatted(code));
    }
}

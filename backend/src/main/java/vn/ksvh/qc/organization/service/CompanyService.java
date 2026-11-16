package vn.ksvh.qc.organization.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.organization.domain.Company;
import vn.ksvh.qc.organization.domain.CompanyRepository;
import vn.ksvh.qc.organization.dto.CompanyRequest;
import vn.ksvh.qc.organization.dto.CompanyResponse;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.NotFoundException;
import vn.ksvh.qc.shared.web.PageResponse;
import vn.ksvh.qc.shared.web.Pageables;

import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyService {

    /** Trường được phép sắp xếp ở danh sách công ty. */
    public static final Set<String> SORTABLE = Set.of("code", "name", "createdAt");

    private final CompanyRepository companyRepository;
    private final vn.ksvh.qc.organization.domain.OrgUnitRepository orgUnitRepository;

    public PageResponse<CompanyResponse> search(String keyword, Boolean active, Pageable pageable) {
        Pageable safe = Pageables.restrictSort(pageable, SORTABLE);
        Specification<Company> spec = Specification.unrestricted();
        if (StringUtils.hasText(keyword)) {
            String kw = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("code")), kw),
                    cb.like(cb.lower(root.get("name")), kw)));
        }
        if (active != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("active"), active));
        }
        return PageResponse.of(companyRepository.findAll(spec, safe), CompanyResponse::from);
    }

    public CompanyResponse get(Long id) {
        return CompanyResponse.from(load(id));
    }

    @Transactional
    public CompanyResponse create(CompanyRequest req) {
        String code = req.code().trim();
        if (companyRepository.existsByCodeIgnoreCase(code)) {
            throw codeTaken(code);
        }
        Company c = new Company();
        apply(c, req, code);
        return CompanyResponse.from(companyRepository.saveAndFlush(c));
    }

    @Transactional
    public CompanyResponse update(Long id, CompanyRequest req) {
        Company c = load(id);
        String code = req.code().trim();
        if (companyRepository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
            throw codeTaken(code);
        }
        apply(c, req, code);
        return CompanyResponse.from(companyRepository.saveAndFlush(c));
    }

    @Transactional
    public void delete(Long id) {
        Company company = load(id);
        long count = orgUnitRepository.countByCompanyId(id);
        if (count > 0) {
            throw new BusinessException(ErrorCode.CONFLICT,
                    "Công ty '%s' đang có %d đơn vị trực thuộc, không thể xoá".formatted(company.getName(), count));
        }
        companyRepository.delete(company);
    }

    /** Dùng cho OrgUnitService: công ty phải tồn tại. */
    Company load(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy công ty #" + id));
    }

    private static void apply(Company c, CompanyRequest req, String code) {
        c.setCode(code);
        c.setName(req.name().trim());
        c.setActive(req.active());
    }

    private static BusinessException codeTaken(String code) {
        return new BusinessException(ErrorCode.ORGANIZATION_CODE_TAKEN, "Mã công ty '%s' đã tồn tại".formatted(code));
    }
}

package vn.ksvh.qc.employee.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.employee.domain.Employee;
import vn.ksvh.qc.employee.domain.EmployeeRepository;
import vn.ksvh.qc.employee.dto.EmployeeRequest;
import vn.ksvh.qc.employee.dto.EmployeeResponse;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.NotFoundException;
import vn.ksvh.qc.shared.web.PageResponse;
import vn.ksvh.qc.shared.web.Pageables;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeService {

    /** Trường được phép sắp xếp ở danh sách nhân viên. */
    public static final Set<String> SORTABLE = Set.of("employeeCode", "fullName", "createdAt");

    private final EmployeeRepository employeeRepository;
    private final OrgUnitLookupApi orgUnits;
    private final UserAccountApi users;

    public PageResponse<EmployeeResponse> search(String keyword, Long orgUnitId, Boolean active, Pageable pageable) {
        Pageable safe = Pageables.restrictSort(pageable, SORTABLE);
        Specification<Employee> spec = Specification.unrestricted();
        if (StringUtils.hasText(keyword)) {
            String kw = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("employeeCode")), kw),
                    cb.like(cb.lower(root.get("fullName")), kw),
                    cb.like(cb.lower(root.get("email")), kw),
                    cb.like(cb.lower(root.get("phone")), kw)));
        }
        if (orgUnitId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("orgUnitId"), orgUnitId));
        }
        if (active != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("active"), active));
        }
        Page<Employee> page = employeeRepository.findAll(spec, safe);
        Map<Long, OrgUnitRef> unitMap = orgUnits.findRefs(page.getContent().stream().map(Employee::getOrgUnitId).toList());
        Map<Long, UserSummary> userMap = users.findSummaries(page.getContent().stream().map(Employee::getUserId).toList());
        return PageResponse.of(page, e -> EmployeeResponse.from(e, lookup(unitMap, e.getOrgUnitId()), lookup(userMap, e.getUserId())));
    }

    public EmployeeResponse get(Long id) {
        return toResponse(load(id));
    }

    @Transactional
    public EmployeeResponse create(EmployeeRequest req, Long actorId) {
        String code = req.employeeCode().trim();
        if (employeeRepository.existsByEmployeeCodeIgnoreCase(code)) {
            throw codeTaken(code);
        }
        if (req.userId() != null && employeeRepository.existsByUserId(req.userId())) {
            throw accountLinked();
        }
        Employee e = new Employee();
        apply(e, req, code, actorId);
        return toResponse(employeeRepository.saveAndFlush(e));
    }

    @Transactional
    public EmployeeResponse update(Long id, EmployeeRequest req, Long actorId) {
        Employee e = load(id);
        String code = req.employeeCode().trim();
        if (employeeRepository.existsByEmployeeCodeIgnoreCaseAndIdNot(code, id)) {
            throw codeTaken(code);
        }
        if (req.userId() != null && employeeRepository.existsByUserIdAndIdNot(req.userId(), id)) {
            throw accountLinked();
        }
        apply(e, req, code, actorId);
        return toResponse(employeeRepository.saveAndFlush(e));
    }

    @Transactional
    public void delete(Long id) {
        Employee e = load(id);
        employeeRepository.delete(e);
    }

    private void apply(Employee e, EmployeeRequest req, String code, Long actorId) {
        if (req.orgUnitId() != null && !Objects.equals(e.getOrgUnitId(), req.orgUnitId())) {
            OrgUnitRef unit = orgUnits.findRefs(List.of(req.orgUnitId())).get(req.orgUnitId());
            if (unit == null || !unit.active()) {
                throw new BusinessException(ErrorCode.EMPLOYEE_INVALID_ORG_UNIT,
                        "Nhà hàng / phòng ban không tồn tại hoặc đã ngưng hoạt động");
            }
        }
        if (req.userId() != null && !Objects.equals(e.getUserId(), req.userId())
                && users.findSummaries(List.of(req.userId())).get(req.userId()) == null) {
            throw new BusinessException(ErrorCode.EMPLOYEE_INVALID_ACCOUNT, "Tài khoản liên kết không tồn tại");
        }
        e.setEmployeeCode(code);
        e.setFullName(req.fullName().trim());
        e.setJobTitle(blankToNull(req.jobTitle()));
        e.setOrgUnitId(req.orgUnitId());
        e.setPhone(blankToNull(req.phone()));
        e.setEmail(blankToNull(req.email()));
        e.setUserId(req.userId());
        e.setActive(req.active());
        e.setUpdatedBy(actorId);
    }

    private Employee load(Long id) {
        return employeeRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên #" + id));
    }

    private EmployeeResponse toResponse(Employee e) {
        OrgUnitRef unit = e.getOrgUnitId() == null ? null : orgUnits.findRefs(List.of(e.getOrgUnitId())).get(e.getOrgUnitId());
        UserSummary user = e.getUserId() == null ? null : users.findSummaries(List.of(e.getUserId())).get(e.getUserId());
        return EmployeeResponse.from(e, unit, user);
    }

    private static <T> T lookup(Map<Long, T> map, Long id) {
        return id == null ? null : map.get(id);
    }

    private static String blankToNull(String s) {
        return StringUtils.hasText(s) ? s.trim() : null;
    }

    private static BusinessException codeTaken(String code) {
        return new BusinessException(ErrorCode.EMPLOYEE_CODE_TAKEN, "Mã nhân viên '%s' đã tồn tại".formatted(code));
    }

    private static BusinessException accountLinked() {
        return new BusinessException(ErrorCode.EMPLOYEE_ACCOUNT_LINKED, "Tài khoản này đã liên kết với nhân viên khác");
    }
}

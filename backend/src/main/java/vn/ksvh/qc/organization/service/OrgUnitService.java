package vn.ksvh.qc.organization.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.organization.domain.Company;
import vn.ksvh.qc.organization.domain.OrgUnit;
import vn.ksvh.qc.organization.domain.OrgUnitRepository;
import vn.ksvh.qc.organization.domain.OrgUnitType;
import vn.ksvh.qc.organization.dto.OrgUnitRequest;
import vn.ksvh.qc.organization.dto.OrgUnitResponse;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.NotFoundException;
import vn.ksvh.qc.shared.web.PageResponse;
import vn.ksvh.qc.shared.web.Pageables;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrgUnitService {

    /** Trường được phép sắp xếp ở danh sách đơn vị. */
    public static final Set<String> SORTABLE = Set.of("code", "name", "unitType", "createdAt");

    private final OrgUnitRepository orgUnitRepository;
    private final CompanyService companyService;
    private final UserAccountApi userAccountApi;

    public PageResponse<OrgUnitResponse> search(String keyword, Long companyId, OrgUnitType unitType, Boolean active,
                                                Pageable pageable) {
        Pageable safe = Pageables.restrictSort(pageable, SORTABLE);
        Specification<OrgUnit> spec = Specification.unrestricted();
        if (StringUtils.hasText(keyword)) {
            String kw = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("code")), kw),
                    cb.like(cb.lower(root.get("name")), kw),
                    cb.like(cb.lower(root.get("address")), kw)));
        }
        if (companyId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("company").get("id"), companyId));
        }
        if (unitType != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("unitType"), unitType));
        }
        if (active != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("active"), active));
        }
        Page<OrgUnit> page = orgUnitRepository.findAll(spec, safe);
        Map<Long, UserSummary> users = userAccountApi.findSummaries(assigneeIds(page.getContent()));
        return PageResponse.of(page, u -> OrgUnitResponse.from(u, users));
    }

    public OrgUnitResponse get(Long id) {
        return toResponse(load(id));
    }

    @Transactional
    public OrgUnitResponse create(OrgUnitRequest req) {
        String code = req.code().trim();
        if (orgUnitRepository.existsByCodeIgnoreCase(code)) {
            throw codeTaken(code);
        }
        OrgUnit u = new OrgUnit();
        apply(u, req, code);
        return toResponse(orgUnitRepository.saveAndFlush(u));
    }

    @Transactional
    public OrgUnitResponse update(Long id, OrgUnitRequest req) {
        OrgUnit u = load(id);
        String code = req.code().trim();
        if (orgUnitRepository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
            throw codeTaken(code);
        }
        apply(u, req, code);
        return toResponse(orgUnitRepository.saveAndFlush(u));
    }

    @Transactional
    public void delete(Long id) {
        OrgUnit unit = load(id);
        orgUnitRepository.delete(unit);
    }

    private void apply(OrgUnit u, OrgUnitRequest req, String code) {
        Company company = companyService.load(req.companyId());
        boolean companyChanged = u.getCompany() == null || !Objects.equals(u.getCompany().getId(), company.getId());
        if (companyChanged && !company.isActive()) {
            throw new BusinessException(ErrorCode.ORGANIZATION_COMPANY_INACTIVE,
                    "Công ty '%s' đã ngưng hoạt động, không thể gắn thêm đơn vị".formatted(company.getName()));
        }
        u.setCompany(company);
        u.setUnitType(req.unitType());
        u.setCode(code);
        u.setName(req.name().trim());
        u.setAddress(blankToNull(req.address()));
        u.setActive(req.active());

        if (req.unitType() == OrgUnitType.RESTAURANT) {
            // Toạ độ chưa bắt buộc; nếu nhập thì phải đủ cả vĩ độ và kinh độ.
            if ((req.latitude() == null) != (req.longitude() == null)) {
                throw new BusinessException(ErrorCode.ORGANIZATION_GPS_REQUIRED, "Nhập đủ cả vĩ độ và kinh độ, hoặc để trống cả hai");
            }
            // CHT / OBM giữ nguyên: chỉ đổi qua setAssignees hoặc RestaurantAssignmentService.
            u.setLatitude(req.latitude());
            u.setLongitude(req.longitude());
            u.setCheckinRadiusM(req.checkinRadiusM());
        } else {
            // Phòng ban không được kiểm tra: không có CHT, OBM, toạ độ.
            u.setStoreManagerUserId(null);
            u.setObmUserId(null);
            u.setLatitude(null);
            u.setLongitude(null);
            u.setCheckinRadiusM(null);
        }
    }

    /**
     * Gán CHT / OBM cho một nhà hàng (dùng khi nhập Excel). {@code null} nghĩa là bỏ gán.
     * Phòng ban không có người phụ trách nên luôn bị bỏ qua.
     */
    @Transactional
    public void setAssignees(Long unitId, Long storeManagerUserId, Long obmUserId) {
        OrgUnit u = load(unitId);
        if (u.getUnitType() != OrgUnitType.RESTAURANT) {
            return;
        }
        if (!Objects.equals(u.getStoreManagerUserId(), storeManagerUserId)) {
            assertAssignee(storeManagerUserId, RoleCodes.STORE_MANAGER, "Cửa hàng trưởng");
        }
        if (!Objects.equals(u.getObmUserId(), obmUserId)) {
            assertAssignee(obmUserId, RoleCodes.OBM, "OBM");
        }
        u.setStoreManagerUserId(storeManagerUserId);
        u.setObmUserId(obmUserId);
    }

    /** Người được gán phải tồn tại, đang hoạt động và có đúng vai trò. Cho phép để trống. */
    private void assertAssignee(Long userId, String requiredRole, String label) {
        if (userId == null) {
            return;
        }
        UserSummary user = userAccountApi.findSummaries(List.of(userId)).get(userId);
        if (user == null || !user.active() || !user.hasRole(requiredRole)) {
            throw new BusinessException(ErrorCode.ORGANIZATION_INVALID_ASSIGNEE,
                    "Người được chọn làm %s không tồn tại, đã bị khoá hoặc không có vai trò %s".formatted(label, label));
        }
    }

    private OrgUnit load(Long id) {
        return orgUnitRepository.findWithCompanyById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn vị #" + id));
    }

    private OrgUnitResponse toResponse(OrgUnit u) {
        return OrgUnitResponse.from(u, userAccountApi.findSummaries(assigneeIds(List.of(u))));
    }

    private static List<Long> assigneeIds(List<OrgUnit> units) {
        List<Long> ids = new ArrayList<>();
        units.forEach(u -> {
            ids.add(u.getStoreManagerUserId());
            ids.add(u.getObmUserId());
        });
        return ids;
    }

    private static String blankToNull(String s) {
        return StringUtils.hasText(s) ? s.trim() : null;
    }

    private static BusinessException codeTaken(String code) {
        return new BusinessException(ErrorCode.ORGANIZATION_CODE_TAKEN, "Mã đơn vị '%s' đã tồn tại".formatted(code));
    }
}

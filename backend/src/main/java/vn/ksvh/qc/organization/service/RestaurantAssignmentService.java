package vn.ksvh.qc.organization.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.organization.domain.OrgUnit;
import vn.ksvh.qc.organization.domain.OrgUnitRepository;
import vn.ksvh.qc.organization.domain.OrgUnitType;
import vn.ksvh.qc.organization.dto.RestaurantAssignmentRequest;
import vn.ksvh.qc.organization.dto.RestaurantAssignmentResponse;
import vn.ksvh.qc.organization.dto.RestaurantAssignmentResponse.AssignedRestaurant;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.NotFoundException;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Gán nhà hàng phụ trách cho Cửa hàng trưởng / OBM từ phía người dùng.
 * Mỗi nhà hàng có tối đa một CHT và một OBM (cột trên bảng org_units); một người có thể phụ trách nhiều nhà hàng.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RestaurantAssignmentService {

    private final OrgUnitRepository orgUnitRepository;
    private final UserAccountApi userAccountApi;

    public RestaurantAssignmentResponse get(Long userId) {
        loadUser(userId);
        return toResponse(userId);
    }

    @Transactional
    public RestaurantAssignmentResponse replace(Long userId, RestaurantAssignmentRequest req) {
        UserSummary user = loadUser(userId);
        Set<Long> chtIds = req.storeManagerRestaurantIds();
        Set<Long> obmIds = req.obmRestaurantIds();
        if (!chtIds.isEmpty()) {
            assertRole(user, RoleCodes.STORE_MANAGER, "Cửa hàng trưởng");
        }
        if (!obmIds.isEmpty()) {
            assertRole(user, RoleCodes.OBM, "OBM");
        }

        Map<Long, OrgUnit> chosen = loadRestaurants(chtIds, obmIds);
        sync(userId, chtIds, chosen, orgUnitRepository.findByStoreManagerUserIdOrderByCodeAsc(userId),
                OrgUnit::setStoreManagerUserId);
        sync(userId, obmIds, chosen, orgUnitRepository.findByObmUserIdOrderByCodeAsc(userId),
                OrgUnit::setObmUserId);
        orgUnitRepository.flush();
        return toResponse(userId);
    }

    /** Bỏ gán nhà hàng không còn được chọn, gán (hoặc chuyển từ người khác) nhà hàng được chọn. */
    private static void sync(Long userId, Set<Long> wanted, Map<Long, OrgUnit> chosen, List<OrgUnit> current,
                             BiConsumer<OrgUnit, Long> setter) {
        current.stream().filter(u -> !wanted.contains(u.getId())).forEach(u -> setter.accept(u, null));
        wanted.forEach(id -> setter.accept(chosen.get(id), userId));
    }

    private Map<Long, OrgUnit> loadRestaurants(Set<Long> chtIds, Set<Long> obmIds) {
        Set<Long> all = new HashSet<>(chtIds);
        all.addAll(obmIds);
        Map<Long, OrgUnit> found = orgUnitRepository.findAllById(all).stream()
                .collect(Collectors.toMap(OrgUnit::getId, Function.identity()));
        for (Long id : all) {
            OrgUnit u = found.get(id);
            if (u == null) {
                throw new NotFoundException("Không tìm thấy nhà hàng #" + id);
            }
            if (u.getUnitType() != OrgUnitType.RESTAURANT) {
                throw new BusinessException(ErrorCode.ORGANIZATION_NOT_RESTAURANT,
                        "'%s' là phòng ban, chỉ gán người phụ trách cho nhà hàng".formatted(u.getName()));
            }
        }
        return found;
    }

    private UserSummary loadUser(Long userId) {
        UserSummary user = userAccountApi.findSummaries(List.of(userId)).get(userId);
        if (user == null) {
            throw new NotFoundException("Không tìm thấy người dùng #" + userId);
        }
        return user;
    }

    private static void assertRole(UserSummary user, String role, String label) {
        if (!user.active() || !user.hasRole(role)) {
            throw new BusinessException(ErrorCode.ORGANIZATION_INVALID_ASSIGNEE,
                    "Người dùng '%s' đã bị khoá hoặc không có vai trò %s".formatted(user.fullName(), label));
        }
    }

    private RestaurantAssignmentResponse toResponse(Long userId) {
        return new RestaurantAssignmentResponse(userId,
                orgUnitRepository.findByStoreManagerUserIdOrderByCodeAsc(userId).stream().map(AssignedRestaurant::from).toList(),
                orgUnitRepository.findByObmUserIdOrderByCodeAsc(userId).stream().map(AssignedRestaurant::from).toList());
    }
}

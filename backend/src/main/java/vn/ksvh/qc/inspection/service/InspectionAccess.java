package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import vn.ksvh.qc.inspection.domain.Finding;
import vn.ksvh.qc.inspection.domain.Inspection;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;

import java.util.List;
import java.util.Objects;

/**
 * Kiểm tra quyền theo dữ liệu cho phiếu chấm và lỗi (quy tắc 2).
 * {@code inspection:read:all} xem mọi thứ; còn lại chỉ thấy phiếu được giao
 * hoặc phiếu của nhà hàng mình là CHT / OBM.
 */
@Component
@RequiredArgsConstructor
class InspectionAccess {

    private static final String DENIED = "Bạn không có quyền với dữ liệu này";

    private final OrgUnitLookupApi orgUnitLookupApi;

    boolean canReadAll(CurrentUser user) {
        return user.has(PermissionCodes.INSPECTION_READ_ALL);
    }

    /** Điều kiện lọc danh sách phiếu theo phạm vi người dùng; {@code null} = không giới hạn. */
    Specification<Inspection> inspectionScope(CurrentUser user) {
        if (canReadAll(user)) {
            return null;
        }
        List<Long> restaurants = orgUnitLookupApi.findRestaurantIdsManagedBy(user.id());
        return (root, q, cb) -> restaurants.isEmpty()
                ? cb.equal(root.get("inspectorId"), user.id())
                : cb.or(cb.equal(root.get("inspectorId"), user.id()), root.get("restaurantId").in(restaurants));
    }

    /** Điều kiện lọc danh sách lỗi; lỗi thuộc phiếu được giao được xử lý bằng danh sách id phiếu. */
    Specification<Finding> findingScope(CurrentUser user, List<Long> ownInspectionIds) {
        if (canReadAll(user)) {
            return null;
        }
        List<Long> restaurants = orgUnitLookupApi.findRestaurantIdsManagedBy(user.id());
        return (root, q, cb) -> {
            var byRestaurant = restaurants.isEmpty() ? cb.disjunction() : root.get("restaurantId").in(restaurants);
            var byInspection = ownInspectionIds.isEmpty() ? cb.disjunction() : root.get("inspectionId").in(ownInspectionIds);
            return cb.or(byRestaurant, byInspection);
        };
    }

    void requireRead(Inspection inspection, CurrentUser user) {
        if (canReadAll(user) || isInspector(inspection, user) || managesRestaurant(inspection.getRestaurantId(), user)) {
            return;
        }
        throw new BusinessException(ErrorCode.ACCESS_DENIED, DENIED);
    }

    /** Chỉ Chuyên viên được giao mới check-in / chấm phiếu. */
    void requireAssignedInspector(Inspection inspection, CurrentUser user) {
        if (!isInspector(inspection, user)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "Phiếu này không được giao cho bạn");
        }
    }

    /** Chỉ CHT của nhà hàng mới xác nhận / khiếu nại / khắc phục lỗi. */
    void requireStoreManager(Long restaurantId, CurrentUser user) {
        OrgUnitRef rest = orgUnitLookupApi.findRefs(List.of(restaurantId)).get(restaurantId);
        if (rest == null || !Objects.equals(rest.storeManagerUserId(), user.id())) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "Bạn không phải Cửa hàng trưởng của nhà hàng này");
        }
    }

    /** Nghiệm thu: Chuyên viên chấm phiếu đó, hoặc người được xem mọi phiếu. */
    void requireVerifier(Inspection inspection, CurrentUser user) {
        if (!canReadAll(user) && !isInspector(inspection, user)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "Bạn không phải Chuyên viên phụ trách phiếu này");
        }
    }

    private boolean isInspector(Inspection inspection, CurrentUser user) {
        return Objects.equals(inspection.getInspectorId(), user.id());
    }

    private boolean managesRestaurant(Long restaurantId, CurrentUser user) {
        return orgUnitLookupApi.findRestaurantIdsManagedBy(user.id()).contains(restaurantId);
    }
}

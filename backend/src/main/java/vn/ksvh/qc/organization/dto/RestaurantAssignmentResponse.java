package vn.ksvh.qc.organization.dto;

import vn.ksvh.qc.organization.domain.OrgUnit;

import java.util.List;

/** Các nhà hàng một người dùng đang phụ trách với vai trò Cửa hàng trưởng và OBM. */
public record RestaurantAssignmentResponse(Long userId, List<AssignedRestaurant> storeManagerOf,
                                           List<AssignedRestaurant> obmOf) {

    public record AssignedRestaurant(Long id, String code, String name) {

        public static AssignedRestaurant from(OrgUnit u) {
            return new AssignedRestaurant(u.getId(), u.getCode(), u.getName());
        }
    }
}

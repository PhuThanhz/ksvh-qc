package vn.ksvh.qc.organization.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

/**
 * Danh sách nhà hàng một người dùng phụ trách, gửi từ màn Người dùng. Thay thế toàn bộ danh sách cũ:
 * nhà hàng không còn trong danh sách sẽ bị bỏ gán; nhà hàng đang thuộc người khác sẽ chuyển sang người này.
 */
public record RestaurantAssignmentRequest(
        @NotNull(message = "Thiếu danh sách nhà hàng phụ trách với vai trò Cửa hàng trưởng")
        @Size(max = 500, message = "Tối đa 500 nhà hàng")
        Set<Long> storeManagerRestaurantIds,

        @NotNull(message = "Thiếu danh sách nhà hàng phụ trách với vai trò OBM")
        @Size(max = 500, message = "Tối đa 500 nhà hàng")
        Set<Long> obmRestaurantIds) {
}

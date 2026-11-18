package vn.ksvh.qc.inspection.dto;

import java.util.List;

/** Cảnh báo nhà hàng còn lỗi chưa nghiệm thu / chưa khắc phục từ tháng trước. */
public record PriorFindingsWarning(
        Long restaurantId,
        String restaurantCode,
        String restaurantName,
        int unverifiedCount,
        int totalUnresolvedCount,
        List<String> warningDetails
) {
}

package vn.ksvh.qc.inspection.dto;

import java.time.LocalDate;

/**
 * Một lịch kiểm tra đã có của chuyên viên (dòng phân công thuộc kế hoạch nháp / chờ duyệt / đã duyệt).
 * Dùng để cảnh báo trùng lịch khi lập kế hoạch; không chặn lưu.
 */
public record InspectorScheduleItem(
        Long inspectorId,
        LocalDate date,
        Long planId,
        String planCode,
        Long restaurantId,
        String restaurantName) {
}

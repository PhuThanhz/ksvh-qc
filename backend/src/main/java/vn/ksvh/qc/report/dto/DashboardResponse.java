package vn.ksvh.qc.report.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.util.List;

/** Số liệu trang Tổng quan: chỉ số chính và dữ liệu biểu đồ. Tháng tính theo giờ Việt Nam. */
public record DashboardResponse(
        Kpis kpis,
        List<MonthPoint> trend,
        List<CountItem> openByRiskLevel,
        List<CountItem> findingsByStatus,
        List<RestaurantRisk> topRestaurants,
        List<CountItem> topCriteria) {

    /**
     * onTimeRate: % lỗi đã đóng trong kỳ được nghiệm thu không trễ hạn (null khi chưa có lỗi nào đóng).
     */
    public record Kpis(
            long inspectionsThisMonth,
            long inspectionsLastMonth,
            long restaurantsInspectedThisMonth,
            long openFindings,
            long overdueFindings,
            @Schema(nullable = true) BigDecimal onTimeRate) {
    }

    /** month dạng yyyy-MM. */
    public record MonthPoint(String month, long inspections, long findings) {
    }

    /** key: mã (mức rủi ro, trạng thái, mã tiêu chí); label: tên hiển thị. */
    public record CountItem(String key, String label, long count) {
    }

    public record RestaurantRisk(Long id, String code, String name, long openFindings, long riskScore) {
    }
}

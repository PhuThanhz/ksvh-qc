package vn.ksvh.qc.report.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.util.List;

/** Số liệu trang Tổng quan: chỉ số chính và dữ liệu biểu đồ chuẩn PDF KSVH. */
public record DashboardResponse(
        Kpis kpis,
        List<MonthPoint> trend,
        List<CountItem> openByRiskLevel,
        List<CountItem> findingsByStatus,
        List<RestaurantRisk> topRestaurants,
        List<CountItem> topCriteria,
        List<RestaurantCompliance> restaurantCompliance) {

    /**
     * Chỉ số KPI cấp cao hiển thị tại trang tổng quan (Slide 1 PDF).
     */
    public record Kpis(
            @Schema(nullable = true) BigDecimal complianceRate,
            long openFindings,
            long highRiskFindings,
            long inspectionsThisMonth,
            long inspectionsLastMonth,
            long restaurantsInspectedThisMonth,
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

    /** Điểm tuân thủ theo từng nhà hàng (Slide 1 PDF: Biểu đồ cột tuân thủ). */
    public record RestaurantCompliance(
            Long id,
            String code,
            String name,
            @Schema(nullable = true) BigDecimal complianceScore,
            boolean attention) {
    }
}

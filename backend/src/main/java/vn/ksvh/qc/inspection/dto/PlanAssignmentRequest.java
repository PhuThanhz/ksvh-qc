package vn.ksvh.qc.inspection.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

/**
 * Một dòng phân công trong kế hoạch (PDF s.9): nhà hàng nào, chuyên viên nào, ngày nào;
 * kế hoạch định kỳ cần mẫu phiếu, kế hoạch đột xuất cần ít nhất một chuyên đề (nhóm tiêu chí).
 */
public record PlanAssignmentRequest(
        @NotNull(message = "Vui lòng chọn nhà hàng")
        Long restaurantId,

        @NotNull(message = "Vui lòng chọn chuyên viên kiểm tra")
        Long inspectorId,

        @io.swagger.v3.oas.annotations.media.Schema(nullable = true)
        Long templateId,

        /** Tuỳ chọn: kế hoạch chỉ giao hạn hoàn thành, chuyên viên tự sắp lịch. Nếu có phải nằm trong kỳ kế hoạch. */
        @io.swagger.v3.oas.annotations.media.Schema(nullable = true)
        LocalDate scheduledDate,

        @io.swagger.v3.oas.annotations.media.Schema(nullable = true)
        @jakarta.validation.constraints.Size(max = 50, message = "Tối đa 50 chuyên đề cho một nhà hàng")
        List<Long> topicGroupIds,

        /** Tiêu chí cụ thể trong các chuyên đề (đột xuất). Trống = toàn bộ tiêu chí đang hoạt động của chuyên đề. */
        @io.swagger.v3.oas.annotations.media.Schema(nullable = true)
        @jakarta.validation.constraints.Size(max = 500, message = "Tối đa 500 tiêu chí cho một nhà hàng")
        List<Long> criterionIds
) {
    /** Dòng phân công định kỳ (mẫu phiếu), không có chuyên đề. */
    public PlanAssignmentRequest(Long restaurantId, Long inspectorId, Long templateId, LocalDate scheduledDate) {
        this(restaurantId, inspectorId, templateId, scheduledDate, null, null);
    }

    /** Dòng phân công đột xuất chỉ chọn chuyên đề (lấy toàn bộ tiêu chí của chuyên đề). */
    public PlanAssignmentRequest(Long restaurantId, Long inspectorId, Long templateId, LocalDate scheduledDate,
                                 List<Long> topicGroupIds) {
        this(restaurantId, inspectorId, templateId, scheduledDate, topicGroupIds, null);
    }
}

package vn.ksvh.qc.inspection.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/** Một dòng phân công trong kế hoạch (PDF s.9): nhà hàng nào, chuyên viên nào, mẫu phiếu nào, ngày nào. */
public record PlanAssignmentRequest(
        @NotNull(message = "Vui lòng chọn nhà hàng")
        Long restaurantId,

        @NotNull(message = "Vui lòng chọn chuyên viên kiểm tra")
        Long inspectorId,

        @NotNull(message = "Vui lòng chọn mẫu phiếu chấm")
        Long templateId,

        @NotNull(message = "Vui lòng chọn ngày kiểm tra dự kiến")
        LocalDate scheduledDate
) {
}

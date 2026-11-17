package vn.ksvh.qc.inspection.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record PlanCreateRequest(
        @NotBlank(message = "Vui lòng nhập mã kế hoạch")
        @Size(max = 30, message = "Mã kế hoạch tối đa 30 ký tự")
        String planCode,

        @NotBlank(message = "Vui lòng nhập tiêu đề kế hoạch")
        @Size(max = 200, message = "Tiêu đề kế hoạch tối đa 200 ký tự")
        String title,

        @NotNull(message = "Vui lòng chọn ngày bắt đầu")
        LocalDate startDate,

        @NotNull(message = "Vui lòng chọn ngày kết thúc")
        LocalDate endDate,

        @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
        String notes,

        /** Danh sách phân công; bắt buộc có ít nhất 1 dòng khi gửi duyệt. Trống = chưa phân công. */
        @Size(max = 200, message = "Tối đa 200 dòng phân công trong một kế hoạch")
        List<@Valid PlanAssignmentRequest> assignments
) {
}

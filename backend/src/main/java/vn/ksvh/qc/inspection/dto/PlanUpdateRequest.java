package vn.ksvh.qc.inspection.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record PlanUpdateRequest(
        @NotBlank(message = "Vui lòng nhập tiêu đề kế hoạch")
        @Size(max = 200, message = "Tiêu đề kế hoạch tối đa 200 ký tự")
        String title,

        /** Tuỳ chọn: bỏ trống = server đặt ngày tạo kế hoạch (tạo mới) hoặc giữ nguyên (sửa). */
        @io.swagger.v3.oas.annotations.media.Schema(nullable = true)
        LocalDate startDate,

        /** Hạn hoàn thành: mọi phiếu chấm của kế hoạch phải xong trước ngày này. */
        @NotNull(message = "Vui lòng chọn hạn hoàn thành")
        LocalDate endDate,

        @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
        String notes,

        /** Danh sách phân công; bắt buộc có ít nhất 1 dòng khi gửi duyệt. Trống = chưa phân công. */
        @Size(max = 200, message = "Tối đa 200 dòng phân công trong một kế hoạch")
        List<@Valid PlanAssignmentRequest> assignments
) {
}

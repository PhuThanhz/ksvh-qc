package vn.ksvh.qc.inspection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import vn.ksvh.qc.inspection.domain.InspectionKind;
import vn.ksvh.qc.inspection.domain.InspectionMode;

import java.util.List;

/**
 * Tạo phiếu kiểm tra.
 * - PERIODIC (định kỳ tháng): bắt buộc templateId, luôn thực tế tại nhà hàng, chấm đủ mọi tiêu chí của mẫu.
 * - SURPRISE (đột xuất): bắt buộc topicGroupIds (chuyên đề = nhóm tiêu chí), thực tế hoặc từ xa.
 */
public record InspectionCreateRequest(
        @NotBlank(message = "Vui lòng nhập mã phiếu chấm")
        @Size(max = 30, message = "Mã phiếu tối đa 30 ký tự")
        String code,

        Long planId,

        @NotNull(message = "Vui lòng chọn nhà hàng")
        Long restaurantId,

        /** Bắt buộc với kiểm tra định kỳ. */
        Long templateId,

        @NotNull(message = "Vui lòng chọn chuyên viên kiểm tra")
        Long inspectorId,

        @NotNull(message = "Vui lòng chọn loại kiểm tra")
        InspectionKind inspectionType,

        /** Trống = thực tế tại nhà hàng. */
        InspectionMode inspectionMode,

        /** Chuyên đề của kiểm tra đột xuất. */
        @Size(max = 50, message = "Tối đa 50 chuyên đề")
        List<Long> topicGroupIds,

        @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
        String notes
) {
}

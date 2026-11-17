package vn.ksvh.qc.inspection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import vn.ksvh.qc.inspection.domain.InspectionKind;
import vn.ksvh.qc.inspection.domain.InspectionMode;

import java.util.List;

/**
 * Yêu cầu tạo đợt kiểm tra hàng loạt cho nhiều nhà hàng cùng lúc.
 * Hệ thống sẽ tự động ghép tiền tố mã phiếu với mã nhà hàng để tạo các phiếu kiểm tra tương ứng.
 */
public record InspectionBatchCreateRequest(
        @NotBlank(message = "Vui lòng nhập tiền tố mã phiếu (VD: KT-T11)")
        @Size(max = 20, message = "Tiền tố mã phiếu tối đa 20 ký tự")
        String codePrefix,

        Long planId,

        @NotEmpty(message = "Vui lòng chọn ít nhất một nhà hàng")
        @Size(max = 100, message = "Tối đa tạo hàng loạt cho 100 nhà hàng trong một lượt")
        List<Long> restaurantIds,

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

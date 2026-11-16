package vn.ksvh.qc.inspection.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

public record InspectionCheckinRequest(
        /** Trống khi thiết bị không lấy được vị trí hoặc kiểm tra từ xa. */
        @DecimalMin(value = "-90", message = "Vĩ độ không hợp lệ")
        @DecimalMax(value = "90", message = "Vĩ độ không hợp lệ")
        Double latitude,

        @DecimalMin(value = "-180", message = "Kinh độ không hợp lệ")
        @DecimalMax(value = "180", message = "Kinh độ không hợp lệ")
        Double longitude
) {
}

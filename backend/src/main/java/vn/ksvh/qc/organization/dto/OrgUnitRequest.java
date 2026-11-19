package vn.ksvh.qc.organization.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;
import vn.ksvh.qc.organization.api.RiskPolicy;
import vn.ksvh.qc.organization.domain.OrgUnitType;

/**
 * Tạo / sửa nhà hàng hoặc phòng ban. Với phòng ban, server bỏ qua toạ độ và bán kính.
 * CHT / OBM không gán ở đây mà qua {@code RestaurantAssignmentService} (màn Người dùng) hoặc file Excel.
 */
public record OrgUnitRequest(
        @NotNull(message = "Vui lòng chọn công ty")
        Long companyId,

        @NotNull(message = "Vui lòng chọn loại đơn vị")
        OrgUnitType unitType,

        @NotBlank(message = "Vui lòng nhập mã đơn vị")
        @Size(max = 30, message = "Mã đơn vị tối đa 30 ký tự")
        @Pattern(regexp = "^[A-Za-z0-9_-]*$", message = "Mã chỉ gồm chữ không dấu, số, dấu gạch ngang hoặc gạch dưới")
        String code,

        @NotBlank(message = "Vui lòng nhập tên đơn vị")
        @Size(max = 200, message = "Tên đơn vị tối đa 200 ký tự")
        String name,

        @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự")
        String address,

        @DecimalMin(value = "-90", message = "Vĩ độ phải từ -90 đến 90")
        @DecimalMax(value = "90", message = "Vĩ độ phải từ -90 đến 90")
        Double latitude,

        @DecimalMin(value = "-180", message = "Kinh độ phải từ -180 đến 180")
        @DecimalMax(value = "180", message = "Kinh độ phải từ -180 đến 180")
        Double longitude,

        @Min(value = 10, message = "Bán kính tối thiểu 10 m")
        @Max(value = 5000, message = "Bán kính tối đa 5000 m")
        Integer checkinRadiusM,

        boolean active,

        /** Chỉ dùng cho nhà hàng; bỏ trống khi sửa = giữ nguyên, khi tạo = Tiêu chuẩn. */
        @Schema(nullable = true)
        RiskPolicy riskPolicy) {

    public OrgUnitRequest(Long companyId, OrgUnitType unitType, String code, String name, String address,
                          Double latitude, Double longitude, Integer checkinRadiusM, boolean active) {
        this(companyId, unitType, code, name, address, latitude, longitude, checkinRadiusM, active, null);
    }
}

package vn.ksvh.qc.inspection.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

@Schema(description = "Yêu cầu lập kế hoạch khắc phục cho nhiều lỗi cùng lúc")
public record BatchRemediationPlanRequest(
        @NotEmpty(message = "Danh sách mã lỗi không được rỗng")
        List<Long> findingIds,
        @NotBlank(message = "Kế hoạch khắc phục không được để trống")
        String remediationPlan,
        @NotNull(message = "Hạn hoàn thành không được để trống")
        LocalDate remediationDeadline
) {
}

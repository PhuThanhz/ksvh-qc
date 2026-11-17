package vn.ksvh.qc.inspection.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.ksvh.qc.inspection.dto.EscalatedCriterionSummary;
import vn.ksvh.qc.inspection.dto.RestaurantRiskProfileResponse;
import vn.ksvh.qc.inspection.service.RestaurantRiskProfileService;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.web.ApiPaths;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping(ApiPaths.V1)
@RequiredArgsConstructor
@Tag(name = "Restaurant Risk Profile", description = "Hồ sơ rủi ro nhà hàng: tần suất vi phạm, mức ảnh hưởng hiệu lực, hạ mức")
public class RestaurantRiskProfileController {

    private final RestaurantRiskProfileService riskProfileService;

    @GetMapping("/restaurants/{restaurantId}/risk-profile")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.INSPECTION_READ_ALL + "', '" + PermissionCodes.REPORT_READ + "', '" + PermissionCodes.INSPECTION_READ_OWN + "')")
    @Operation(summary = "Xem hồ sơ rủi ro chi tiết của nhà hàng (tần suất trong kỳ, mức hiệu lực, ngày dự kiến hạ mức)")
    public RestaurantRiskProfileResponse getRestaurantRiskProfile(
            @PathVariable Long restaurantId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {
        return riskProfileService.getRestaurantRiskProfile(restaurantId, asOfDate);
    }

    @GetMapping("/risk/escalated-criteria")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.INSPECTION_READ_ALL + "', '" + PermissionCodes.REPORT_READ + "')")
    @Operation(summary = "Danh sách toàn bộ các tiêu chí đang bị nâng mức rủi ro trên toàn hệ thống")
    public List<EscalatedCriterionSummary> getEscalatedCriteria(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {
        return riskProfileService.getEscalatedCriteria(asOfDate);
    }
}

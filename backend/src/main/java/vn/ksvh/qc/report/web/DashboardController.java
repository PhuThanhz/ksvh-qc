package vn.ksvh.qc.report.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.ksvh.qc.report.dto.DashboardResponse;
import vn.ksvh.qc.report.service.DashboardService;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.web.ApiPaths;

/** Số liệu trang Tổng quan (vận hành): người xem báo cáo hoặc xem mọi phiếu. */
@RestController
@RequestMapping(ApiPaths.V1 + "/reports")
@RequiredArgsConstructor
@Validated
public class DashboardController {

    private final DashboardService service;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.REPORT_READ + "', '" + PermissionCodes.INSPECTION_READ_ALL + "')")
    public DashboardResponse dashboard(
            @RequestParam(defaultValue = "6") @Min(value = 3, message = "Tối thiểu 3 tháng") @Max(value = 12, message = "Tối đa 12 tháng") int months) {
        return service.summary(months);
    }
}

package vn.ksvh.qc.report.web;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.ksvh.qc.report.dto.ApprovalQueueResponse;
import vn.ksvh.qc.report.dto.DashboardResponse;
import vn.ksvh.qc.report.service.DashboardService;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.web.ApiPaths;

import java.time.LocalDate;

/** Số liệu trang Tổng quan (vận hành): người xem báo cáo hoặc xem mọi phiếu. */
@RestController
@RequestMapping(ApiPaths.V1 + "/reports")
@RequiredArgsConstructor
@Validated
public class DashboardController {

    private final DashboardService service;

    /**
     * Kỳ thống kê tự chọn [from, to] (cả hai ngày tính). Bỏ trống: 6 tháng gần nhất (từ đầu tháng thứ 6 đến hôm nay).
     * Chỉ số "hiện tại" (lỗi đang mở, rủi ro cao, nhà hàng rủi ro) không phụ thuộc kỳ.
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.REPORT_READ + "', '" + PermissionCodes.INSPECTION_READ_ALL + "')")
    public DashboardResponse dashboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.summary(from, to);
    }

    @GetMapping("/approval-queue")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.REPORT_READ + "', '" + PermissionCodes.INSPECTION_READ_ALL + "', '" + PermissionCodes.PLAN_APPROVE + "', '" + PermissionCodes.FINDING_CONCLUDE_APPEAL + "')")
    public ApprovalQueueResponse approvalQueue() {
        return service.getApprovalQueue();
    }
}

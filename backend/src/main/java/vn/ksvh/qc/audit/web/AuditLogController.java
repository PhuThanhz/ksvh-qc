package vn.ksvh.qc.audit.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.ksvh.qc.audit.dto.AuditLogFilter;
import vn.ksvh.qc.audit.dto.AuditLogResponse;
import vn.ksvh.qc.audit.service.AuditLogService;
import vn.ksvh.qc.security.permission.PermissionCodes;

@RestController
@RequestMapping("/api/v1/audit-logs")
@Tag(name = "Audit Log", description = "Nhật ký hệ thống & toàn vẹn dữ liệu")
@PreAuthorize("hasAuthority('" + PermissionCodes.SYSTEM_LOG_READ + "')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Operation(summary = "Tìm kiếm nhật ký hệ thống phân trang")
    public Page<AuditLogResponse> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        AuditLogFilter filter = new AuditLogFilter(keyword, action, targetType, userId, fromDate, toDate);
        return auditLogService.search(filter, pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một bản ghi nhật ký")
    public AuditLogResponse get(@PathVariable Long id) {
        return auditLogService.get(id);
    }

    @GetMapping("/actions")
    @Operation(summary = "Danh sách các loại thao tác đã ghi nhận")
    public List<String> getActions() {
        return auditLogService.getActions();
    }

    @GetMapping("/target-types")
    @Operation(summary = "Danh sách các loại đối tượng bị tác động")
    public List<String> getTargetTypes() {
        return auditLogService.getTargetTypes();
    }
}

package vn.ksvh.qc.report.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.ksvh.qc.report.dto.*;
import vn.ksvh.qc.report.service.PdfExportService;
import vn.ksvh.qc.report.service.ReportService;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.excel.ExcelResponses;
import vn.ksvh.qc.shared.pdf.PdfResponses;
import vn.ksvh.qc.shared.web.ApiPaths;

@RestController
@RequestMapping(ApiPaths.V1 + "/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Báo cáo phân tích và xuất file Excel / PDF")
public class ReportController {

    private final ReportService reportService;
    private final PdfExportService pdfExportService;

    // 1. Tổng hợp phiếu chấm theo tháng
    @GetMapping("/monthly-summary")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.REPORT_READ + "', '" + PermissionCodes.INSPECTION_READ_ALL + "')")
    @Operation(summary = "Báo cáo tổng hợp phiếu chấm theo tháng (số phiếu, % tuân thủ, lỗi M1-M4)")
    public MonthlySummaryReportResponse monthlySummary(ReportFilter filter) {
        return reportService.getMonthlySummary(filter);
    }

    @GetMapping("/monthly-summary/export-excel")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.REPORT_READ + "', '" + PermissionCodes.REPORT_EXPORT + "')")
    @Operation(summary = "Xuất Excel báo cáo tổng hợp phiếu chấm theo tháng")
    public ResponseEntity<byte[]> exportMonthlySummaryExcel(ReportFilter filter) {
        return ExcelResponses.file("Bao-cao-tong-hop-thang", reportService.exportMonthlySummaryExcel(filter));
    }

    // 2. Xếp hạng nhà hàng theo rủi ro & tuân thủ
    @GetMapping("/restaurant-rankings")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.REPORT_READ + "', '" + PermissionCodes.INSPECTION_READ_ALL + "')")
    @Operation(summary = "Báo cáo xếp hạng nhà hàng theo điểm rủi ro và tỷ lệ tuân thủ")
    public RestaurantRankingReportResponse restaurantRankings(ReportFilter filter) {
        return reportService.getRestaurantRankings(filter);
    }

    @GetMapping("/restaurant-rankings/export-excel")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.REPORT_READ + "', '" + PermissionCodes.REPORT_EXPORT + "')")
    @Operation(summary = "Xuất Excel báo cáo xếp hạng nhà hàng")
    public ResponseEntity<byte[]> exportRestaurantRankingsExcel(ReportFilter filter) {
        return ExcelResponses.file("Xep-hang-nha-hang", reportService.exportRestaurantRankingsExcel(filter));
    }

    // 3. Phân tích lỗi theo tiêu chí (Pareto)
    @GetMapping("/criteria-violations")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.REPORT_READ + "', '" + PermissionCodes.INSPECTION_READ_ALL + "')")
    @Operation(summary = "Báo cáo phân tích lỗi vi phạm theo tiêu chí và nhóm tiêu chí (Pareto)")
    public CriteriaViolationReportResponse criteriaViolations(ReportFilter filter) {
        return reportService.getCriteriaViolations(filter);
    }

    @GetMapping("/criteria-violations/export-excel")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.REPORT_READ + "', '" + PermissionCodes.REPORT_EXPORT + "')")
    @Operation(summary = "Xuất Excel báo cáo lỗi theo tiêu chí")
    public ResponseEntity<byte[]> exportCriteriaViolationsExcel(ReportFilter filter) {
        return ExcelResponses.file("Loi-theo-tieu-chi", reportService.exportCriteriaViolationsExcel(filter));
    }

    // 4. Tình trạng & tiến độ khắc phục lỗi
    @GetMapping("/remediations")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.REPORT_READ + "', '" + PermissionCodes.INSPECTION_READ_ALL + "')")
    @Operation(summary = "Báo cáo tình trạng khắc phục: đúng hạn, quá hạn, đang mở theo nhà hàng và CHT")
    public RemediationStatusReportResponse remediations(ReportFilter filter) {
        return reportService.getRemediationStatus(filter);
    }

    @GetMapping("/remediations/export-excel")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.REPORT_READ + "', '" + PermissionCodes.REPORT_EXPORT + "')")
    @Operation(summary = "Xuất Excel báo cáo tình trạng khắc phục lỗi")
    public ResponseEntity<byte[]> exportRemediationsExcel(ReportFilter filter) {
        return ExcelResponses.file("Tien-do-khac-phuc", reportService.exportRemediationStatusExcel(filter));
    }

    // 5. Năng suất chuyên viên KSVH
    @GetMapping("/inspector-productivity")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.REPORT_READ + "', '" + PermissionCodes.INSPECTION_READ_ALL + "')")
    @Operation(summary = "Báo cáo năng suất chuyên viên KSVH: số phiếu, thời gian chấm, số lỗi phát hiện")
    public InspectorProductivityReportResponse inspectorProductivity(ReportFilter filter) {
        return reportService.getInspectorProductivity(filter);
    }

    @GetMapping("/inspector-productivity/export-excel")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.REPORT_READ + "', '" + PermissionCodes.REPORT_EXPORT + "')")
    @Operation(summary = "Xuất Excel báo cáo năng suất chuyên viên")
    public ResponseEntity<byte[]> exportInspectorProductivityExcel(ReportFilter filter) {
        return ExcelResponses.file("Nang-suat-chuyen-vien", reportService.exportInspectorProductivityExcel(filter));
    }

    // 6. Xuất PDF phiếu chấm và Biên bản M4
    @GetMapping("/inspections/{id}/export-pdf")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.REPORT_READ + "', '" + PermissionCodes.INSPECTION_READ_ALL + "', '" + PermissionCodes.INSPECTION_READ_OWN + "')")
    @Operation(summary = "Xuất PDF phiếu kiểm tra đầy đủ (kèm checkin GPS, kết quả từng tiêu chí và lỗi phát hiện)")
    public ResponseEntity<byte[]> exportInspectionPdf(@PathVariable Long id) {
        byte[] pdf = pdfExportService.generateInspectionPdf(id);
        return PdfResponses.file("Phieu-kiem-tra-" + id, pdf);
    }

    @GetMapping("/findings/{id}/export-m4-pdf")
    @PreAuthorize("hasAnyAuthority('" + PermissionCodes.REPORT_READ + "', '" + PermissionCodes.INSPECTION_READ_ALL + "', '" + PermissionCodes.FINDING_RESPOND + "')")
    @Operation(summary = "Xuất PDF biên bản ghi nhận sự cố / vi phạm đặc biệt nghiêm trọng M4")
    public ResponseEntity<byte[]> exportM4FindingPdf(@PathVariable Long id) {
        byte[] pdf = pdfExportService.generateM4AlertPdf(id);
        return PdfResponses.file("Bien-ban-vi-pham-M4-" + id, pdf);
    }
}

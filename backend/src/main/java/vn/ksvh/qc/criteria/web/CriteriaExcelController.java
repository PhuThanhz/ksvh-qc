package vn.ksvh.qc.criteria.web;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.ksvh.qc.criteria.service.CriteriaExcelService;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.shared.excel.ExcelResponses;
import vn.ksvh.qc.shared.excel.ImportResult;
import vn.ksvh.qc.shared.web.ApiPaths;

/**
 * Nhập / xuất Excel danh mục tiêu chí và mẫu phiếu.
 * Nhập: gọi với commit=false để kiểm tra (không ghi gì), không lỗi thì gọi lại với commit=true.
 */
@RestController
@RequestMapping(ApiPaths.V1)
@RequiredArgsConstructor
public class CriteriaExcelController {

    private final CriteriaExcelService service;

    @GetMapping("/criteria/export")
    @PreAuthorize(CriterionController.CAN_READ)
    public ResponseEntity<byte[]> exportCriteria() {
        return ExcelResponses.file("Danh-muc-tieu-chi", service.exportCriteria());
    }

    @GetMapping("/criteria/import-template")
    @PreAuthorize(CriterionController.CAN_MANAGE)
    public ResponseEntity<byte[]> criteriaTemplate() {
        return ExcelResponses.file("Mau-nhap-tieu-chi", service.criteriaTemplate());
    }

    @PostMapping(value = "/criteria/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize(CriterionController.CAN_MANAGE)
    public ImportResult importCriteria(@RequestPart("file") MultipartFile file,
                                       @RequestParam(defaultValue = "false") boolean commit,
                                       @AuthenticationPrincipal Jwt jwt) {
        return service.importCriteria(file, commit, CurrentUser.from(jwt).id());
    }

    @GetMapping("/inspection-templates/export")
    @PreAuthorize(CriterionController.CAN_READ)
    public ResponseEntity<byte[]> exportTemplates() {
        return ExcelResponses.file("Danh-muc-mau-phieu", service.exportTemplates());
    }

    @GetMapping("/inspection-templates/import-template")
    @PreAuthorize(CriterionController.CAN_MANAGE)
    public ResponseEntity<byte[]> templatesTemplate() {
        return ExcelResponses.file("Mau-nhap-mau-phieu", service.templatesTemplate());
    }

    @PostMapping(value = "/inspection-templates/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize(CriterionController.CAN_MANAGE)
    public ImportResult importTemplates(@RequestPart("file") MultipartFile file,
                                        @RequestParam(defaultValue = "false") boolean commit,
                                        @AuthenticationPrincipal Jwt jwt) {
        return service.importTemplates(file, commit, CurrentUser.from(jwt).id());
    }
}

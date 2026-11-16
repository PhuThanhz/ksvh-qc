package vn.ksvh.qc.organization.web;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.ksvh.qc.organization.service.OrganizationExcelService;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.excel.ExcelResponses;
import vn.ksvh.qc.shared.excel.ImportResult;
import vn.ksvh.qc.shared.web.ApiPaths;

/** Nhập / xuất Excel công ty và nhà hàng / phòng ban (một file, hai sheet). commit=false: chỉ kiểm tra. */
@RestController
@RequestMapping(ApiPaths.V1 + "/organizations")
@RequiredArgsConstructor
public class OrganizationExcelController {

    private static final String CAN_READ = "hasAuthority('" + PermissionCodes.ORGANIZATION_READ + "')";
    private static final String CAN_MANAGE = "hasAuthority('" + PermissionCodes.ORGANIZATION_MANAGE + "')";

    private final OrganizationExcelService service;

    @GetMapping("/export")
    @PreAuthorize(CAN_READ)
    public ResponseEntity<byte[]> export() {
        return ExcelResponses.file("Danh-muc-to-chuc", service.export());
    }

    @GetMapping("/import-template")
    @PreAuthorize(CAN_MANAGE)
    public ResponseEntity<byte[]> template() {
        return ExcelResponses.file("Mau-nhap-to-chuc", service.template());
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize(CAN_MANAGE)
    public ImportResult importFile(@RequestPart("file") MultipartFile file, @RequestParam(defaultValue = "false") boolean commit) {
        return service.importFile(file, commit);
    }
}

package vn.ksvh.qc.employee.web;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.ksvh.qc.employee.service.EmployeeExcelService;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.excel.ExcelResponses;
import vn.ksvh.qc.shared.excel.ImportResult;
import vn.ksvh.qc.shared.web.ApiPaths;

/** Nhập / xuất Excel hồ sơ nhân viên. commit=false: chỉ kiểm tra. */
@RestController
@RequestMapping(ApiPaths.V1 + "/employees")
@RequiredArgsConstructor
public class EmployeeExcelController {

    private final EmployeeExcelService service;

    @GetMapping("/export")
    @PreAuthorize("hasAuthority('" + PermissionCodes.EMPLOYEE_READ + "')")
    public ResponseEntity<byte[]> export() {
        return ExcelResponses.file("Danh-sach-nhan-vien", service.export());
    }

    @GetMapping("/import-template")
    @PreAuthorize("hasAuthority('" + PermissionCodes.EMPLOYEE_MANAGE + "')")
    public ResponseEntity<byte[]> template() {
        return ExcelResponses.file("Mau-nhap-nhan-vien", service.template());
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('" + PermissionCodes.EMPLOYEE_MANAGE + "')")
    public ImportResult importFile(@RequestPart("file") MultipartFile file, @RequestParam(defaultValue = "false") boolean commit,
                                   @AuthenticationPrincipal Jwt jwt) {
        return service.importFile(file, commit, CurrentUser.from(jwt).id());
    }
}

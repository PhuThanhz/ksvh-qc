package vn.ksvh.qc;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.support.ApiTestSupport;
import vn.ksvh.qc.support.ExcelTestFiles;

import java.io.ByteArrayInputStream;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Nhập / xuất Excel: tổ chức, nhân viên, người dùng. */
class CatalogExcelApiTests extends ApiTestSupport {

    private byte[] download(String path, String... perms) throws Exception {
        return mvc.perform(get(path).with(as(1L, perms))).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
    }

    private static List<Object> row(Object... values) {
        return Arrays.asList(values);
    }

    @Test
    void organizationImportLinksCompanyAndStoreManager() throws Exception {
        String[] perms = {PermissionCodes.ORGANIZATION_READ, PermissionCodes.ORGANIZATION_MANAGE};
        long cht = insertUser("cht_" + suffix, RoleCodes.STORE_MANAGER);
        var file = ExcelTestFiles.fill(download("/api/v1/organizations/import-template", perms), Map.of(
                "Công ty", List.of(row("CTY-" + suffix, "Công ty nhập", "Có")),
                "Nhà hàng - Phòng ban", List.of(
                        row("NH-" + suffix, "Nhà hàng 1", "CTY-" + suffix, "Nhà hàng", "1 Lê Lợi", "cht_" + suffix, null,
                                10.762622, 106.660172, 150, "Có"),
                        row("PB-" + suffix, "Phòng KSVH", "cty-" + suffix, "phòng ban"))));
        mvc.perform(multipart("/api/v1/organizations/import").file(file).param("commit", "true").with(as(1L, perms)))
                .andExpect(jsonPath("$.errors.length()").value(0))
                .andExpect(jsonPath("$.committed").value(true))
                .andExpect(jsonPath("$.created").value(3));
        Map<String, Object> unit = jdbc.queryForMap(
                "SELECT unit_type, store_manager_user_id, checkin_radius_m FROM org_units WHERE code = ?", "NH-" + suffix);
        assertThat(unit.get("unit_type")).isEqualTo("RESTAURANT");
        assertThat(((Number) unit.get("store_manager_user_id")).longValue()).isEqualTo(cht);

        // Tài khoản CHT không tồn tại → lỗi, không ghi gì
        var bad = ExcelTestFiles.fill(download("/api/v1/organizations/import-template", perms), Map.of(
                "Nhà hàng - Phòng ban", List.of(row("NH2-" + suffix, "Nhà hàng 2", "CTY-" + suffix, "Nhà hàng", null,
                        "khongco_" + suffix))));
        mvc.perform(multipart("/api/v1/organizations/import").file(bad).param("commit", "true").with(as(1L, perms)))
                .andExpect(jsonPath("$.committed").value(false))
                .andExpect(jsonPath("$.errors[0].column").value("Tài khoản CHT"));

        byte[] exported = download("/api/v1/organizations/export", PermissionCodes.ORGANIZATION_READ);
        try (XSSFWorkbook wb = new XSSFWorkbook(new ByteArrayInputStream(exported))) {
            assertThat(wb.getSheet("Nhà hàng - Phòng ban")).isNotNull();
        }
    }

    @Test
    void employeeImportResolvesUnitAndAccount() throws Exception {
        String[] perms = {PermissionCodes.EMPLOYEE_READ, PermissionCodes.EMPLOYEE_MANAGE};
        insertUser("nv_" + suffix, RoleCodes.KSVH_INSPECTOR);
        long company = jdbc.queryForObject("INSERT INTO companies(code, name) VALUES (?, 'C') RETURNING id", Long.class, "C-" + suffix);
        jdbc.update("INSERT INTO org_units(company_id, code, name, unit_type) VALUES (?, ?, 'PB', 'DEPARTMENT')", company, "PB-" + suffix);
        var file = ExcelTestFiles.fill(download("/api/v1/employees/import-template", perms), Map.of(
                "Nhân viên", List.of(row("NV-" + suffix, "Nguyễn Văn A", "Chuyên viên", "PB-" + suffix, "0909 123 456",
                        "a@ksvh.vn", "nv_" + suffix, "Có"))));
        mvc.perform(multipart("/api/v1/employees/import").file(file).param("commit", "true").with(as(1L, perms)))
                .andExpect(jsonPath("$.errors.length()").value(0))
                .andExpect(jsonPath("$.created").value(1));
        download("/api/v1/employees/export", PermissionCodes.EMPLOYEE_READ);
    }

    @Test
    void userImportCreatesWithPasswordAndUpdatesWithout() throws Exception {
        String[] perms = {PermissionCodes.USER_READ, PermissionCodes.USER_MANAGE};
        byte[] tpl = download("/api/v1/users/import-template", perms);
        var create = ExcelTestFiles.fill(tpl, Map.of("Người dùng", List.of(
                row("U_" + suffix, "Người dùng nhập", "ksvh_inspector, STORE_MANAGER", "Matkhau123", "Có"),
                row("v_" + suffix, "Thiếu mật khẩu", "OBM", null, "Có"),
                row("w_" + suffix, "Sai vai trò", "KHONG_CO"))));
        mvc.perform(multipart("/api/v1/users/import").file(create).param("commit", "true").with(as(1L, perms)))
                .andExpect(jsonPath("$.committed").value(false))
                .andExpect(jsonPath("$.errors[?(@.row == 6 && @.column == 'Mật khẩu ban đầu')]").exists())
                .andExpect(jsonPath("$.errors[?(@.row == 7 && @.column == 'Vai trò')]").exists());

        // (Test chạy trong một transaction nên dùng tên khác với lần nhập lỗi ở trên.)
        var ok = ExcelTestFiles.fill(tpl, Map.of("Người dùng", List.of(
                row("X_" + suffix, "Người dùng nhập", "KSVH_INSPECTOR", "Matkhau123", "Có"))));
        mvc.perform(multipart("/api/v1/users/import").file(ok).param("commit", "true").with(as(1L, perms)))
                .andExpect(jsonPath("$.committed").value(true))
                .andExpect(jsonPath("$.created").value(1));

        var update = ExcelTestFiles.fill(tpl, Map.of("Người dùng", List.of(
                row("x_" + suffix, "Đổi tên", "OBM", null, "Không"))));
        mvc.perform(multipart("/api/v1/users/import").file(update).param("commit", "true").with(as(1L, perms)))
                .andExpect(jsonPath("$.committed").value(true))
                .andExpect(jsonPath("$.updated").value(1));
        assertThat(jdbc.queryForObject("SELECT full_name FROM users WHERE username = ?", String.class, "x_" + suffix))
                .isEqualTo("Đổi tên");

        byte[] exported = download("/api/v1/users/export", PermissionCodes.USER_READ);
        try (XSSFWorkbook wb = new XSSFWorkbook(new ByteArrayInputStream(exported))) {
            var sh = wb.getSheet("Người dùng");
            for (var r : sh) {
                if (r.getRowNum() > 3 && r.getCell(3) != null) {
                    assertThat(r.getCell(3).toString()).as("Không xuất mật khẩu").isEmpty();
                }
            }
        }
    }
}

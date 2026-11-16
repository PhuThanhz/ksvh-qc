package vn.ksvh.qc.criteria;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.support.ApiTestSupport;
import vn.ksvh.qc.support.ExcelTestFiles;

import java.io.ByteArrayInputStream;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Nhập / xuất Excel danh mục tiêu chí và mẫu phiếu. */
class CriteriaExcelApiTests extends ApiTestSupport {

    private static final String[] MANAGE = {PermissionCodes.CRITERIA_READ, PermissionCodes.CRITERIA_MANAGE};

    private byte[] template(String path) throws Exception {
        return mvc.perform(get(path).with(as(1L, MANAGE)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString(".xlsx")))
                .andReturn().getResponse().getContentAsByteArray();
    }

    private static List<Object> row(Object... values) {
        return Arrays.asList(values);
    }

    @Test
    void templateHasGuideAndInputSheets() throws Exception {
        try (XSSFWorkbook wb = new XSSFWorkbook(new ByteArrayInputStream(template("/api/v1/criteria/import-template")))) {
            assertThat(wb.getSheetName(0)).isEqualTo("Hướng dẫn");
            assertThat(wb.getSheet("Tiêu chí").getRow(3).getCell(0).getStringCellValue()).isEqualTo("Mã tiêu chí *");
        }
    }

    @Test
    void dryRunReportsCountsWithoutCommitting() throws Exception {
        MockMultipartFile file = ExcelTestFiles.fill(template("/api/v1/criteria/import-template"), Map.of(
                "Nhóm tiêu chí", List.of(row("NX-" + suffix, "Nhóm nhập", 1, null, "Có")),
                "Tiêu chí", List.of(
                        row("TX-" + suffix + ".1", "Bàn ghế bụi", "NX-" + suffix, 1, "Lau khăn trắng", "Ảnh", 1, "Có"),
                        row("TX-" + suffix + ".2", "Sàn ướt", "nx-" + suffix, 3, null, null, null, null))));

        mvc.perform(multipart("/api/v1/criteria/import").file(file).with(as(1L, MANAGE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.committed").value(false))
                .andExpect(jsonPath("$.totalRows").value(3))
                .andExpect(jsonPath("$.created").value(3))
                .andExpect(jsonPath("$.errors.length()").value(0));
    }

    @Test
    void commitCreatesThenUpdatesByCode() throws Exception {
        byte[] tpl = template("/api/v1/criteria/import-template");
        MockMultipartFile first = ExcelTestFiles.fill(tpl, Map.of(
                "Nhóm tiêu chí", List.of(row("NC-" + suffix, "Nhóm nhập", 1, null, "Có")),
                "Tiêu chí", List.of(row("TC-" + suffix, "Bàn ghế bụi", "NC-" + suffix, 2, null, null, 1, "Có"))));
        mvc.perform(multipart("/api/v1/criteria/import").file(first).param("commit", "true").with(as(1L, MANAGE)))
                .andExpect(jsonPath("$.committed").value(true))
                .andExpect(jsonPath("$.created").value(2));

        MockMultipartFile second = ExcelTestFiles.fill(tpl, Map.of(
                "Tiêu chí", List.of(row("tc-" + suffix, "Bàn ghế bụi bẩn", "NC-" + suffix, 4, null, null, 1, "Không"))));
        mvc.perform(multipart("/api/v1/criteria/import").file(second).param("commit", "true").with(as(1L, MANAGE)))
                .andExpect(jsonPath("$.committed").value(true))
                .andExpect(jsonPath("$.updated").value(1));

        Map<String, Object> saved = jdbc.queryForMap("SELECT name, base_impact, active FROM criteria WHERE lower(code) = lower(?)", "TC-" + suffix);
        assertThat(saved.get("name")).isEqualTo("Bàn ghế bụi bẩn");
        assertThat(((Number) saved.get("base_impact")).intValue()).isEqualTo(4);
        assertThat(saved.get("active")).isEqualTo(false);
    }

    @Test
    void rowErrorsPointToSheetRowAndColumnAndNothingIsCommitted() throws Exception {
        MockMultipartFile file = ExcelTestFiles.fill(template("/api/v1/criteria/import-template"), Map.of(
                "Tiêu chí", List.of(
                        row("OK-" + suffix, "Hợp lệ", "KHONGCO-" + suffix, 1),
                        row("BAD-" + suffix, null, null, 9),
                        row("XX-" + suffix, "Sai kiểu", null, "abc"))));
        mvc.perform(multipart("/api/v1/criteria/import").file(file).param("commit", "true").with(as(1L, MANAGE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.committed").value(false))
                .andExpect(jsonPath("$.errors[0].sheet").value("Tiêu chí"))
                .andExpect(jsonPath("$.errors[0].row").value(5))
                .andExpect(jsonPath("$.errors[0].column").value("Mã nhóm"))
                .andExpect(jsonPath("$.errors[?(@.row == 6 && @.column == 'Tên tiêu chí')]").exists())
                .andExpect(jsonPath("$.errors[?(@.row == 6 && @.column == 'Mức ảnh hưởng')]").exists())
                .andExpect(jsonPath("$.errors[?(@.row == 7 && @.column == 'Mức ảnh hưởng')].message")
                        .value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.containsString("Phải là số"))));
    }

    @Test
    void rejectsNonExcelFileAndRequiresManagePermission() throws Exception {
        MockMultipartFile txt = new MockMultipartFile("file", "data.csv", "text/csv", "a,b".getBytes());
        mvc.perform(multipart("/api/v1/criteria/import").file(txt).with(as(1L, MANAGE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("EXCEL_INVALID_FILE"));
        mvc.perform(multipart("/api/v1/criteria/import").file(txt).with(as(1L, PermissionCodes.CRITERIA_READ)))
                .andExpect(status().isForbidden());
    }

    @Test
    void exportContainsImportedRowsAndTemplatesRoundTrip() throws Exception {
        byte[] tpl = template("/api/v1/criteria/import-template");
        mvc.perform(multipart("/api/v1/criteria/import").file(ExcelTestFiles.fill(tpl, Map.of(
                        "Nhóm tiêu chí", List.of(row("NE-" + suffix, "Nhóm xuất", 1)),
                        "Tiêu chí", List.of(row("A-" + suffix, "Tiêu chí A", "NE-" + suffix, 1),
                                row("B-" + suffix, "Tiêu chí B", "NE-" + suffix, 2)))))
                        .param("commit", "true").with(as(1L, MANAGE)))
                .andExpect(jsonPath("$.committed").value(true));

        // Mẫu phiếu: B trước A theo cột Thứ tự
        MockMultipartFile templates = ExcelTestFiles.fill(template("/api/v1/inspection-templates/import-template"), Map.of(
                "Mẫu phiếu", List.of(row("MP-" + suffix, "Mẫu nhập", null, "Buffet", "Định kỳ")),
                "Tiêu chí trong mẫu", List.of(row("MP-" + suffix, "A-" + suffix, 2), row("MP-" + suffix, "B-" + suffix, 1))));
        mvc.perform(multipart("/api/v1/inspection-templates/import").file(templates).param("commit", "true").with(as(1L, MANAGE)))
                .andExpect(jsonPath("$.committed").value(true))
                .andExpect(jsonPath("$.created").value(1));
        List<String> codes = jdbc.queryForList("""
                SELECT c.code FROM template_criteria tc JOIN criteria c ON c.id = tc.criterion_id
                JOIN inspection_templates t ON t.id = tc.template_id WHERE t.code = ? ORDER BY tc.sort_order""", String.class, "MP-" + suffix);
        assertThat(codes).containsExactly("B-" + suffix, "A-" + suffix);

        byte[] exported = mvc.perform(get("/api/v1/criteria/export").with(as(1L, PermissionCodes.CRITERIA_READ)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
        try (XSSFWorkbook wb = new XSSFWorkbook(new ByteArrayInputStream(exported))) {
            var sheet = wb.getSheet("Tiêu chí");
            boolean found = false;
            for (var r : sheet) {
                if (r.getCell(0) != null && ("A-" + suffix).equals(r.getCell(0).toString())) {
                    found = true;
                }
            }
            assertThat(found).isTrue();
        }
    }
}

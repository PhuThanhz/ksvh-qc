package vn.ksvh.qc.support;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.Map;

/** Điền dữ liệu vào file mẫu tải từ API (hàng tiêu đề ở dòng 4), giống người dùng nhập tay. */
public final class ExcelTestFiles {

    private static final int FIRST_DATA_ROW = 4;

    private ExcelTestFiles() {
    }

    /** rowsBySheet: tên sheet → các dòng, mỗi dòng là giá trị theo đúng thứ tự cột của file mẫu (null = để trống). */
    public static MockMultipartFile fill(byte[] template, Map<String, List<List<Object>>> rowsBySheet) {
        try (XSSFWorkbook wb = new XSSFWorkbook(new ByteArrayInputStream(template));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            rowsBySheet.forEach((sheetName, rows) -> {
                Sheet sh = wb.getSheet(sheetName);
                if (sh == null) {
                    throw new IllegalArgumentException("Không có sheet " + sheetName);
                }
                for (int i = 0; i < rows.size(); i++) {
                    Row row = sh.getRow(FIRST_DATA_ROW + i);
                    if (row == null) {
                        row = sh.createRow(FIRST_DATA_ROW + i);
                    }
                    List<Object> values = rows.get(i);
                    for (int c = 0; c < values.size(); c++) {
                        Object v = values.get(c);
                        var cell = row.getCell(c) != null ? row.getCell(c) : row.createCell(c);
                        if (v instanceof Number n) {
                            cell.setCellValue(n.doubleValue());
                        } else if (v != null) {
                            cell.setCellValue(v.toString());
                        }
                    }
                }
            });
            wb.write(out);
            return new MockMultipartFile("file", "nhap.xlsx",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", out.toByteArray());
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}

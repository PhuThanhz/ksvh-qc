package vn.ksvh.qc.shared.excel;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/** Một dòng dữ liệu của file nhập, đọc ô theo tên cột. Ô sai kiểu → {@link ExcelCellException}. */
public final class ExcelRow {

    private static final DataFormatter FORMATTER = new DataFormatter(Locale.ROOT);
    private static final Set<String> TRUE = Set.of("có", "co", "x", "true", "yes", "1", "đang hoạt động", "hoạt động");
    private static final Set<String> FALSE = Set.of("không", "khong", "false", "no", "0", "ngưng", "ngưng hoạt động");

    private final String sheet;
    private final Row row;
    private final Map<String, Integer> columns;

    ExcelRow(String sheet, Row row, Map<String, Integer> columns) {
        this.sheet = sheet;
        this.row = row;
        this.columns = columns;
    }

    public String sheet() {
        return sheet;
    }

    /** Số dòng như Excel hiển thị. */
    public int number() {
        return row.getRowNum() + 1;
    }

    /** Chuỗi đã cắt khoảng trắng; ô trống → null. */
    public String text(String column) {
        Cell c = cell(column);
        if (c == null) {
            return null;
        }
        String v;
        if (c.getCellType() == CellType.NUMERIC && !DateUtil.isCellDateFormatted(c)) {
            BigDecimal d = BigDecimal.valueOf(c.getNumericCellValue()).stripTrailingZeros();
            v = d.toPlainString();
        } else {
            v = FORMATTER.formatCellValue(c);
        }
        v = v.replace('\u00A0', ' ').trim();
        return v.isEmpty() ? null : v;
    }

    public Integer integer(String column) {
        BigDecimal d = decimal(column);
        if (d == null) {
            return null;
        }
        try {
            return d.intValueExact();
        } catch (ArithmeticException e) {
            throw new ExcelCellException(column, "Phải là số nguyên");
        }
    }

    public BigDecimal decimal(String column) {
        Cell c = cell(column);
        if (c == null) {
            return null;
        }
        if (c.getCellType() == CellType.NUMERIC || (c.getCellType() == CellType.FORMULA && c.getCachedFormulaResultType() == CellType.NUMERIC)) {
            return BigDecimal.valueOf(c.getNumericCellValue());
        }
        String t = text(column);
        if (t == null) {
            return null;
        }
        try {
            return new BigDecimal(t.replace(" ", "").replace(',', '.'));
        } catch (NumberFormatException e) {
            throw new ExcelCellException(column, "Phải là số (giá trị đang nhập: \"%s\")".formatted(t));
        }
    }

    public Double number(String column) {
        BigDecimal d = decimal(column);
        return d == null ? null : d.doubleValue();
    }

    public LocalDate date(String column) {
        Cell c = cell(column);
        if (c == null) {
            return null;
        }
        if (c.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(c)) {
            return c.getLocalDateTimeCellValue().toLocalDate();
        }
        String t = text(column);
        if (t == null) {
            return null;
        }
        try {
            String[] p = t.split("[/.-]");
            if (p.length == 3 && p[0].length() <= 2) {
                return LocalDate.of(Integer.parseInt(p[2]), Integer.parseInt(p[1]), Integer.parseInt(p[0]));
            }
            return LocalDate.parse(t);
        } catch (RuntimeException e) {
            throw new ExcelCellException(column, "Ngày không hợp lệ, nhập dạng dd/mm/yyyy");
        }
    }

    /** Có / Không (cũng nhận x, true/false, 1/0). Ô trống → defaultValue. */
    public boolean bool(String column, boolean defaultValue) {
        Cell c = cell(column);
        if (c != null && c.getCellType() == CellType.BOOLEAN) {
            return c.getBooleanCellValue();
        }
        String t = text(column);
        if (t == null) {
            return defaultValue;
        }
        String v = t.toLowerCase(Locale.ROOT);
        if (TRUE.contains(v)) {
            return true;
        }
        if (FALSE.contains(v)) {
            return false;
        }
        throw new ExcelCellException(column, "Chỉ nhập Có hoặc Không");
    }

    /** Danh sách cách nhau bởi dấu phẩy / chấm phẩy / xuống dòng. Ô trống → danh sách rỗng. */
    public List<String> list(String column) {
        String t = text(column);
        if (t == null) {
            return List.of();
        }
        return Arrays.stream(t.split("[,;\\n]")).map(String::trim).filter(s -> !s.isEmpty()).distinct().toList();
    }

    /** Giá trị phải nằm trong danh sách hiển thị (không phân biệt hoa thường) → trả về khoá tương ứng. */
    public <E> E choice(String column, Map<String, E> labelToValue) {
        String t = text(column);
        if (t == null) {
            return null;
        }
        for (var e : labelToValue.entrySet()) {
            if (e.getKey().equalsIgnoreCase(t)) {
                return e.getValue();
            }
        }
        throw new ExcelCellException(column, "Giá trị \"%s\" không hợp lệ, chọn: %s".formatted(t, String.join(", ", labelToValue.keySet())));
    }

    boolean isBlank() {
        for (int idx : columns.values()) {
            Cell c = row.getCell(idx);
            if (c != null && c.getCellType() != CellType.BLANK && !FORMATTER.formatCellValue(c).isBlank()) {
                return false;
            }
        }
        return true;
    }

    private Cell cell(String column) {
        Integer idx = columns.get(ExcelImportFile.normalize(column));
        if (idx == null) {
            return null; // cột không bắt buộc và không có trong file
        }
        Cell c = row.getCell(idx);
        if (c == null || c.getCellType() == CellType.BLANK) {
            return null;
        }
        if (c.getCellType() == CellType.ERROR) {
            throw new ExcelCellException(column, "Ô đang báo lỗi công thức");
        }
        return c;
    }
}

package vn.ksvh.qc.shared.excel;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

/** File .xlsx người dùng tải lên. Đọc sheet theo tên, cột theo tiêu đề (không phụ thuộc thứ tự cột). */
public final class ExcelImportFile implements AutoCloseable {

    public static final long MAX_BYTES = 5L * 1024 * 1024;
    public static final int MAX_ROWS = 5000;
    private static final int HEADER_SEARCH_ROWS = 15;
    private static final DataFormatter FORMATTER = new DataFormatter(Locale.ROOT);

    private final XSSFWorkbook workbook;

    private ExcelImportFile(XSSFWorkbook workbook) {
        this.workbook = workbook;
    }

    public static ExcelImportFile open(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw invalid("Vui lòng chọn file Excel (.xlsx)");
        }
        String name = Objects.toString(file.getOriginalFilename(), "").toLowerCase(Locale.ROOT);
        if (!name.endsWith(".xlsx")) {
            throw invalid("Chỉ nhận file Excel .xlsx (nếu đang dùng .xls hãy Lưu thành .xlsx)");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BusinessException(ErrorCode.PAYLOAD_TOO_LARGE, "File vượt quá 5 MB");
        }
        try (InputStream in = file.getInputStream()) {
            return new ExcelImportFile(new XSSFWorkbook(in));
        } catch (IOException | RuntimeException e) {
            throw invalid("Không đọc được file. Hãy kiểm tra file có đúng định dạng Excel .xlsx và không bị khoá mật khẩu");
        }
    }

    /**
     * Các dòng có dữ liệu của sheet (bỏ dòng trống). Thiếu cột bắt buộc → lỗi cả file.
     *
     * @param required sheet bắt buộc phải có (false: không có sheet → danh sách rỗng)
     */
    public List<ExcelRow> rows(ExcelSheet<?> spec, boolean required) {
        Sheet sheet = workbook.getSheet(spec.name());
        if (sheet == null) {
            if (required) {
                throw invalid("Không tìm thấy sheet \"%s\". Hãy dùng file mẫu tải từ hệ thống".formatted(spec.name()));
            }
            return List.of();
        }
        List<String> requiredHeaders = spec.columns().stream().filter(ExcelSheet.Column::isRequired)
                .map(c -> normalize(c.header())).toList();
        Set<String> known = new HashSet<>();
        spec.columns().forEach(c -> known.add(normalize(c.header())));

        Row headerRow = null;
        Map<String, Integer> columns = new HashMap<>();
        for (int r = 0; r <= Math.min(HEADER_SEARCH_ROWS, sheet.getLastRowNum()); r++) {
            Row row = sheet.getRow(r);
            if (row == null) {
                continue;
            }
            Map<String, Integer> found = new HashMap<>();
            for (Cell c : row) {
                String h = normalize(FORMATTER.formatCellValue(c));
                if (known.contains(h)) {
                    found.putIfAbsent(h, c.getColumnIndex());
                }
            }
            if (!found.isEmpty() && found.keySet().containsAll(requiredHeaders)) {
                headerRow = row;
                columns = found;
                break;
            }
        }
        if (headerRow == null) {
            List<String> names = spec.columns().stream().filter(ExcelSheet.Column::isRequired).map(ExcelSheet.Column::header).toList();
            throw invalid("Sheet \"%s\" thiếu hàng tiêu đề hoặc thiếu cột bắt buộc: %s".formatted(spec.name(), String.join(", ", names)));
        }

        List<ExcelRow> result = new ArrayList<>();
        for (int r = headerRow.getRowNum() + 1; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (row == null) {
                continue;
            }
            ExcelRow er = new ExcelRow(spec.name(), row, columns);
            if (er.isBlank()) {
                continue;
            }
            if (result.size() >= MAX_ROWS) {
                throw invalid("Sheet \"%s\" vượt quá %d dòng, hãy chia thành nhiều file".formatted(spec.name(), MAX_ROWS));
            }
            result.add(er);
        }
        return result;
    }

    /** Chuẩn hoá tiêu đề: bỏ dấu *, khoảng trắng thừa, không phân biệt hoa thường. */
    static String normalize(String header) {
        return header == null ? "" : header.replace("*", "").replace('\u00A0', ' ').trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    private static BusinessException invalid(String message) {
        return new BusinessException(ErrorCode.EXCEL_INVALID_FILE, message);
    }

    @Override
    public void close() {
        try {
            workbook.close();
        } catch (IOException ignored) {
            // chỉ đọc, không cần xử lý
        }
    }
}

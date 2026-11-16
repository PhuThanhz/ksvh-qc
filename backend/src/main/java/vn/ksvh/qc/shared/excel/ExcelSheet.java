package vn.ksvh.qc.shared.excel;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

/**
 * Mô tả một sheet Excel: tên, tiêu đề, các cột và dữ liệu. Dùng chung cho file xuất và file mẫu nhập.
 * <pre>
 * ExcelSheet.of("Tiêu chí", "DANH MỤC TIÊU CHÍ", rows)
 *     .column("Mã tiêu chí", 16, Criterion::getCode).required().note("Không dấu, không trùng")
 *     .column("Mức ảnh hưởng", 14, Criterion::getBaseImpact).required().options("1", "2", "3", "4", "5");
 * </pre>
 */
public final class ExcelSheet<T> {

    /** Một cột: tiêu đề (không kèm dấu *), độ rộng theo số ký tự, cách lấy giá trị. */
    public static final class Column<T> {
        final String header;
        final int width;
        final Function<T, Object> value;
        boolean required;
        String note;
        List<String> options = List.of();
        boolean wrap;

        Column(String header, int width, Function<T, Object> value) {
            this.header = header;
            this.width = width;
            this.value = value;
        }

        public String header() {
            return header;
        }

        public boolean isRequired() {
            return required;
        }

        public String note() {
            return note;
        }

        public List<String> options() {
            return options;
        }
    }

    final String name;
    final String title;
    final List<T> rows;
    final List<Column<T>> columns = new ArrayList<>();

    private ExcelSheet(String name, String title, List<T> rows) {
        this.name = name;
        this.title = title;
        this.rows = rows;
    }

    /** name: tên sheet (≤ 31 ký tự); title: dòng tiêu đề in đậm đầu sheet. */
    public static <T> ExcelSheet<T> of(String name, String title, List<T> rows) {
        if (name.length() > 31) {
            throw new IllegalArgumentException("Tên sheet tối đa 31 ký tự: " + name);
        }
        return new ExcelSheet<>(name, title, rows);
    }

    public ExcelSheet<T> column(String header, int width, Function<T, Object> value) {
        columns.add(new Column<>(header, width, value));
        return this;
    }

    /** Cột bắt buộc khi nhập: tiêu đề có dấu * đỏ. */
    public ExcelSheet<T> required() {
        last().required = true;
        return this;
    }

    /** Ghi chú hướng dẫn: hiện khi rê chuột vào tiêu đề và trong sheet Hướng dẫn. */
    public ExcelSheet<T> note(String note) {
        last().note = note;
        return this;
    }

    /** Danh sách giá trị hợp lệ: tạo ô chọn (dropdown) trong file. */
    public ExcelSheet<T> options(List<String> options) {
        last().options = List.copyOf(options);
        return this;
    }

    public ExcelSheet<T> options(String... options) {
        return options(List.of(options));
    }

    /** Văn bản dài: tự xuống dòng trong ô. */
    public ExcelSheet<T> wrap() {
        last().wrap = true;
        return this;
    }

    public String name() {
        return name;
    }

    public List<Column<T>> columns() {
        return List.copyOf(columns);
    }

    private Column<T> last() {
        if (columns.isEmpty()) {
            throw new IllegalStateException("Chưa khai báo cột nào");
        }
        return columns.getLast();
    }
}

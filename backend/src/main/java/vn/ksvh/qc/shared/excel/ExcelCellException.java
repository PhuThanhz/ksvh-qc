package vn.ksvh.qc.shared.excel;

/** Giá trị một ô không đọc được (sai kiểu, sai danh sách...). Được ghi thành lỗi của dòng, không làm dừng việc nhập. */
public class ExcelCellException extends RuntimeException {

    private final String column;

    public ExcelCellException(String column, String message) {
        super(message);
        this.column = column;
    }

    public String column() {
        return column;
    }
}

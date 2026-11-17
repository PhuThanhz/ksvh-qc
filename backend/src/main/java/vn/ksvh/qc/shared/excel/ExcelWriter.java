package vn.ksvh.qc.shared.excel;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Tạo file .xlsx trình bày chuẩn: dòng tiêu đề, dòng thông tin, hàng tiêu đề cột màu đậm, cố định hàng tiêu đề,
 * bộ lọc, viền, sọc nền xen kẽ, ô chọn cho cột có danh sách giá trị, ghi chú ở tiêu đề, sheet "Hướng dẫn".
 * Bố cục mỗi sheet: dòng 1 tiêu đề, dòng 2 thông tin, dòng 4 tiêu đề cột, dữ liệu từ dòng 5
 * ({@link ExcelImportFile} tự dò hàng tiêu đề nên vẫn đọc được file người dùng đã chèn/xoá dòng phía trên).
 */
public final class ExcelWriter {

    public static final String GUIDE_SHEET = "Hướng dẫn";
    static final int HEADER_ROW = 3;
    private static final int TEMPLATE_INPUT_ROWS = 500;
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter STAMP = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final String FONT = "Arial";

    private static final byte[] NAVY = rgb(0x1F, 0x3A, 0x5F);
    private static final byte[] STRIPE = rgb(0xF4, 0xF7, 0xFB);
    private static final byte[] BORDER = rgb(0xC9, 0xD3, 0xE0);
    private static final byte[] MUTED = rgb(0x5B, 0x67, 0x78);
    private static final byte[] REQUIRED = rgb(0xFF, 0xC7, 0xC7);
    private static final byte[] NOTE_FILL = rgb(0xFF, 0xF8, 0xE1);

    private ExcelWriter() {
    }

    /** File xuất dữ liệu. */
    public static byte[] export(List<ExcelSheet<?>> sheets) {
        return build(sheets, false, List.of());
    }

    /** File mẫu nhập: thêm sheet Hướng dẫn (đặt đầu), dữ liệu mẫu (nếu có) và ô chọn cho 500 dòng nhập. */
    public static byte[] template(List<ExcelSheet<?>> sheets, List<String> guideLines) {
        return build(sheets, true, guideLines);
    }

    private static byte[] build(List<ExcelSheet<?>> sheets, boolean template, List<String> guideLines) {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Styles st = new Styles(wb);
            if (template) {
                writeGuide(wb, st, sheets, guideLines);
            }
            for (ExcelSheet<?> sheet : sheets) {
                writeSheet(wb, st, sheet, template);
            }
            // File mẫu mở vào sheet Hướng dẫn để người nhập đọc trước.
            wb.setActiveSheet(0);
            wb.setSelectedTab(0);
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("Không tạo được file Excel", e);
        }
    }

    private static <T> void writeSheet(XSSFWorkbook wb, Styles st, ExcelSheet<T> spec, boolean template) {
        XSSFSheet sh = wb.createSheet(spec.name);
        int cols = spec.columns.size();
        sh.setDisplayGridlines(false);

        Row title = sh.createRow(0);
        title.setHeightInPoints(26);
        cell(title, 0, spec.title, st.title);
        if (cols > 1) {
            sh.addMergedRegion(new CellRangeAddress(0, 0, 0, cols - 1));
        }
        Row info = sh.createRow(1);
        String infoText = template
                ? "File mẫu nhập liệu · Cột có dấu * là bắt buộc · Rê chuột vào tiêu đề cột để xem hướng dẫn · Không đổi tên tiêu đề cột"
                : "Xuất lúc %s · %d dòng".formatted(LocalDateTime.now(ZONE).format(STAMP), spec.rows.size());
        cell(info, 0, infoText, st.info);
        if (cols > 1) {
            sh.addMergedRegion(new CellRangeAddress(1, 1, 0, cols - 1));
        }

        Row header = sh.createRow(HEADER_ROW);
        header.setHeightInPoints(32);
        XSSFDrawing drawing = sh.createDrawingPatriarch();
        CreationHelper helper = wb.getCreationHelper();
        for (int c = 0; c < cols; c++) {
            ExcelSheet.Column<T> col = spec.columns.get(c);
            Cell h = header.createCell(c);
            if (col.required) {
                XSSFRichTextString text = new XSSFRichTextString(col.header + " *");
                text.applyFont(0, col.header.length(), st.headerFont);
                text.applyFont(col.header.length(), col.header.length() + 2, st.requiredMarkFont);
                h.setCellValue(text);
            } else {
                h.setCellValue(col.header);
            }
            h.setCellStyle(st.header);
            // Chừa chỗ cho dấu * và nút lọc để tiêu đề không bị che.
            // Chữ in đậm rộng hơn chữ thường ~25%, nút lọc chiếm ~5 ký tự.
            int headerChars = (int) Math.ceil((col.header.length() + (col.required ? 2 : 0)) * 1.25) + 6;
            sh.setColumnWidth(c, Math.min(255, Math.max(Math.max(8, col.width), headerChars)) * 256);
            if (col.note != null || !col.options.isEmpty()) {
                ClientAnchor anchor = helper.createClientAnchor();
                anchor.setCol1(c);
                anchor.setCol2(c + 3);
                anchor.setRow1(HEADER_ROW);
                anchor.setRow2(HEADER_ROW + 5);
                Comment comment = drawing.createCellComment(anchor);
                comment.setString(helper.createRichTextString(describe(col)));
                comment.setAuthor("KSVH QC");
                h.setCellComment(comment);
            }
        }

        int r = HEADER_ROW + 1;
        for (T item : spec.rows) {
            Row row = sh.createRow(r);
            boolean stripe = (r - HEADER_ROW) % 2 == 0;
            for (int c = 0; c < cols; c++) {
                ExcelSheet.Column<T> col = spec.columns.get(c);
                writeValue(row.createCell(c), col.value.apply(item), st, stripe, col.wrap);
            }
            r++;
        }

        int lastDataRow = template ? HEADER_ROW + Math.max(spec.rows.size(), TEMPLATE_INPUT_ROWS) : r - 1;
        if (template) {
            // Ô trống có viền để người nhập thấy vùng nhập liệu.
            for (int rr = r; rr <= HEADER_ROW + 50; rr++) {
                Row row = sh.createRow(rr);
                for (int c = 0; c < cols; c++) {
                    row.createCell(c).setCellStyle(spec.columns.get(c).wrap ? st.textWrap : st.text);
                }
            }
        }
        addDropdowns(sh, spec, lastDataRow);

        sh.createFreezePane(0, HEADER_ROW + 1);
        sh.setAutoFilter(new CellRangeAddress(HEADER_ROW, Math.max(HEADER_ROW, r - 1), 0, cols - 1));
        PrintSetup ps = sh.getPrintSetup();
        ps.setLandscape(true);
        ps.setPaperSize(PrintSetup.A4_PAPERSIZE);
        sh.setFitToPage(true);
        ps.setFitWidth((short) 1);
        ps.setFitHeight((short) 0);
        sh.setRepeatingRows(new CellRangeAddress(HEADER_ROW, HEADER_ROW, 0, cols - 1));
        sh.getFooter().setCenter("Trang &P / &N");
    }

    private static <T> void addDropdowns(XSSFSheet sh, ExcelSheet<T> spec, int lastRow) {
        if (lastRow <= HEADER_ROW) {
            return;
        }
        DataValidationHelper dv = sh.getDataValidationHelper();
        for (int c = 0; c < spec.columns.size(); c++) {
            List<String> options = spec.columns.get(c).options;
            // Danh sách nhúng trực tiếp tối đa 255 ký tự (giới hạn của Excel).
            if (options.isEmpty() || String.join(",", options).length() > 250) {
                continue;
            }
            DataValidationConstraint constraint = dv.createExplicitListConstraint(options.toArray(String[]::new));
            DataValidation v = dv.createValidation(constraint, new CellRangeAddressList(HEADER_ROW + 1, lastRow, c, c));
            v.setShowErrorBox(true);
            v.setErrorStyle(DataValidation.ErrorStyle.STOP);
            v.createErrorBox("Giá trị không hợp lệ", "Chọn một giá trị trong danh sách: " + String.join(", ", options));
            v.setSuppressDropDownArrow(false);
            sh.addValidationData(v);
        }
    }

    private static void writeGuide(XSSFWorkbook wb, Styles st, List<ExcelSheet<?>> sheets, List<String> lines) {
        XSSFSheet sh = wb.createSheet(GUIDE_SHEET);
        sh.setDisplayGridlines(false);
        sh.setColumnWidth(0, 22 * 256);
        sh.setColumnWidth(1, 30 * 256);
        sh.setColumnWidth(2, 12 * 256);
        sh.setColumnWidth(3, 80 * 256);
        int r = 0;
        Row title = sh.createRow(r++);
        title.setHeightInPoints(26);
        cell(title, 0, "HƯỚNG DẪN NHẬP LIỆU", st.title);
        sh.addMergedRegion(new CellRangeAddress(0, 0, 0, 3));
        r++;
        List<String> all = new ArrayList<>(lines);
        all.add("Mỗi dòng là một bản ghi. Mã đã có trong hệ thống sẽ được CẬP NHẬT, mã chưa có sẽ được THÊM MỚI.");
        all.add("Khi tải file lên, hệ thống kiểm tra toàn bộ trước. Có lỗi ở bất kỳ dòng nào thì không ghi gì cả.");
        all.add("Cột Hoạt động: nhập Có hoặc Không (để trống = Có).");
        all.add("Không đổi tên sheet và tên tiêu đề cột. Có thể thêm/xoá dòng dữ liệu, đổi thứ tự cột.");
        for (String line : all) {
            Row row = sh.createRow(r++);
            cell(row, 0, "•  " + line, st.guideText);
            sh.addMergedRegion(new CellRangeAddress(row.getRowNum(), row.getRowNum(), 0, 3));
        }
        for (ExcelSheet<?> spec : sheets) {
            r++;
            Row sec = sh.createRow(r++);
            sec.setHeightInPoints(20);
            cell(sec, 0, "Sheet \"" + spec.name + "\"", st.section);
            sh.addMergedRegion(new CellRangeAddress(sec.getRowNum(), sec.getRowNum(), 0, 3));
            Row head = sh.createRow(r++);
            head.setHeightInPoints(22);
            String[] titles = {"Cột", "Giá trị hợp lệ", "Bắt buộc", "Mô tả"};
            for (int c = 0; c < titles.length; c++) {
                cell(head, c, titles[c], st.header);
            }
            for (ExcelSheet.Column<?> col : spec.columns) {
                Row row = sh.createRow(r++);
                boolean stripe = r % 2 == 0;
                cell(row, 0, col.header, stripe ? st.textStripe : st.text);
                cell(row, 1, col.options.isEmpty() ? "" : String.join(", ", col.options), stripe ? st.textWrapStripe : st.textWrap);
                cell(row, 2, col.required ? "Bắt buộc" : "", col.required ? st.requiredTag : (stripe ? st.textStripe : st.text));
                cell(row, 3, col.note == null ? "" : col.note, stripe ? st.textWrapStripe : st.textWrap);
            }
        }
        wb.setSheetOrder(GUIDE_SHEET, 0);
    }

    private static String describe(ExcelSheet.Column<?> col) {
        StringBuilder sb = new StringBuilder();
        if (col.required) {
            sb.append("Bắt buộc. ");
        }
        if (col.note != null) {
            sb.append(col.note);
        }
        if (!col.options.isEmpty()) {
            sb.append(sb.isEmpty() ? "" : "\n").append("Giá trị: ").append(String.join(", ", col.options));
        }
        return sb.toString().trim();
    }

    private static void writeValue(Cell cell, Object value, Styles st, boolean stripe, boolean wrap) {
        switch (value) {
            case null -> cell.setCellStyle(pick(st, stripe, wrap));
            case Boolean b -> {
                cell.setCellValue(b ? "Có" : "Không");
                cell.setCellStyle(stripe ? st.centerStripe : st.center);
            }
            case BigDecimal d -> {
                cell.setCellValue(d.doubleValue());
                cell.setCellStyle(stripe ? st.decimalStripe : st.decimal);
            }
            case Double d -> {
                cell.setCellValue(d);
                cell.setCellStyle(stripe ? st.decimalStripe : st.decimal);
            }
            case Number n -> {
                cell.setCellValue(n.longValue());
                cell.setCellStyle(stripe ? st.integerStripe : st.integer);
            }
            case LocalDate d -> {
                cell.setCellValue(d);
                cell.setCellStyle(stripe ? st.dateStripe : st.date);
            }
            case Instant i -> {
                cell.setCellValue(LocalDateTime.ofInstant(i, ZONE));
                cell.setCellStyle(stripe ? st.dateTimeStripe : st.dateTime);
            }
            default -> {
                cell.setCellValue(value.toString());
                cell.setCellStyle(pick(st, stripe, wrap));
            }
        }
    }

    private static CellStyle pick(Styles st, boolean stripe, boolean wrap) {
        if (wrap) {
            return stripe ? st.textWrapStripe : st.textWrap;
        }
        return stripe ? st.textStripe : st.text;
    }

    private static void cell(Row row, int col, String value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value);
        c.setCellStyle(style);
    }

    private static byte[] rgb(int r, int g, int b) {
        return new byte[]{(byte) r, (byte) g, (byte) b};
    }

    /** Bộ style dùng chung trong một workbook (Excel giới hạn số style, không tạo theo từng ô). */
    private static final class Styles {
        final XSSFCellStyle title, info, header, section, guideText, requiredTag;
        final XSSFCellStyle text, textStripe, textWrap, textWrapStripe, center, centerStripe;
        final XSSFCellStyle integer, integerStripe, decimal, decimalStripe, date, dateStripe, dateTime, dateTimeStripe;
        final XSSFFont headerFont, requiredMarkFont;

        Styles(XSSFWorkbook wb) {
            XSSFFont titleFont = font(wb, 14, true, NAVY);
            XSSFFont infoFont = font(wb, 9, false, MUTED);
            infoFont.setItalic(true);
            headerFont = font(wb, 10, true, rgb(0xFF, 0xFF, 0xFF));
            requiredMarkFont = font(wb, 10, true, REQUIRED);
            XSSFFont body = font(wb, 10, false, null);
            XSSFFont sectionFont = font(wb, 11, true, NAVY);
            XSSFFont tagFont = font(wb, 10, true, rgb(0xB4, 0x23, 0x18));

            title = base(wb, titleFont, false);
            title.setVerticalAlignment(VerticalAlignment.CENTER);
            info = base(wb, infoFont, false);
            section = base(wb, sectionFont, false);
            guideText = base(wb, body, false);
            guideText.setWrapText(true);

            header = bordered(wb, headerFont, null);
            header.setFillForegroundColor(new XSSFColor(NAVY, null));
            header.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            header.setAlignment(HorizontalAlignment.CENTER);
            header.setVerticalAlignment(VerticalAlignment.CENTER);
            header.setWrapText(true);

            text = bordered(wb, body, null);
            textStripe = bordered(wb, body, STRIPE);
            textWrap = bordered(wb, body, null);
            textWrap.setWrapText(true);
            textWrapStripe = bordered(wb, body, STRIPE);
            textWrapStripe.setWrapText(true);
            center = bordered(wb, body, null);
            center.setAlignment(HorizontalAlignment.CENTER);
            centerStripe = bordered(wb, body, STRIPE);
            centerStripe.setAlignment(HorizontalAlignment.CENTER);
            requiredTag = bordered(wb, tagFont, NOTE_FILL);
            requiredTag.setAlignment(HorizontalAlignment.CENTER);

            short intFmt = wb.createDataFormat().getFormat("#,##0");
            short decFmt = wb.createDataFormat().getFormat("#,##0.######");
            short dateFmt = wb.createDataFormat().getFormat("dd/mm/yyyy");
            short dtFmt = wb.createDataFormat().getFormat("dd/mm/yyyy hh:mm");
            integer = numeric(wb, body, null, intFmt);
            integerStripe = numeric(wb, body, STRIPE, intFmt);
            decimal = numeric(wb, body, null, decFmt);
            decimalStripe = numeric(wb, body, STRIPE, decFmt);
            date = numeric(wb, body, null, dateFmt);
            dateStripe = numeric(wb, body, STRIPE, dateFmt);
            dateTime = numeric(wb, body, null, dtFmt);
            dateTimeStripe = numeric(wb, body, STRIPE, dtFmt);
        }

        private static XSSFFont font(XSSFWorkbook wb, int size, boolean bold, byte[] color) {
            XSSFFont f = wb.createFont();
            f.setFontName(FONT);
            f.setFontHeightInPoints((short) size);
            f.setBold(bold);
            if (color != null) {
                f.setColor(new XSSFColor(color, null));
            }
            return f;
        }

        private static XSSFCellStyle base(XSSFWorkbook wb, XSSFFont font, boolean wrap) {
            XSSFCellStyle s = wb.createCellStyle();
            s.setFont(font);
            s.setWrapText(wrap);
            s.setVerticalAlignment(VerticalAlignment.TOP);
            return s;
        }

        private static XSSFCellStyle bordered(XSSFWorkbook wb, XSSFFont font, byte[] fill) {
            XSSFCellStyle s = base(wb, font, false);
            XSSFColor border = new XSSFColor(BORDER, null);
            s.setBorderTop(BorderStyle.THIN);
            s.setBorderBottom(BorderStyle.THIN);
            s.setBorderLeft(BorderStyle.THIN);
            s.setBorderRight(BorderStyle.THIN);
            s.setTopBorderColor(border);
            s.setBottomBorderColor(border);
            s.setLeftBorderColor(border);
            s.setRightBorderColor(border);
            s.setVerticalAlignment(VerticalAlignment.CENTER);
            if (fill != null) {
                s.setFillForegroundColor(new XSSFColor(fill, null));
                s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            }
            return s;
        }

        private static XSSFCellStyle numeric(XSSFWorkbook wb, XSSFFont font, byte[] fill, short format) {
            XSSFCellStyle s = bordered(wb, font, fill);
            s.setDataFormat(format);
            s.setAlignment(HorizontalAlignment.RIGHT);
            return s;
        }
    }
}

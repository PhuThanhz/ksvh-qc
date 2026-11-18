package vn.ksvh.qc.report.service.pdf;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.awt.Color;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Slf4j
@Component
public class PdfLayoutSupport {

    public static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    public static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    public static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private BaseFont regularBaseFont;
    private BaseFont boldBaseFont;

    private synchronized void initFonts() {
        if (regularBaseFont != null && boldBaseFont != null) {
            return;
        }
        try {
            ClassPathResource regRes = new ClassPathResource("fonts/BeVietnamPro-Regular.ttf");
            byte[] regBytes = StreamUtils.copyToByteArray(regRes.getInputStream());
            regularBaseFont = BaseFont.createFont("BeVietnamPro-Regular.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, regBytes, null);

            ClassPathResource boldRes = new ClassPathResource("fonts/BeVietnamPro-Bold.ttf");
            byte[] boldBytes = StreamUtils.copyToByteArray(boldRes.getInputStream());
            boldBaseFont = BaseFont.createFont("BeVietnamPro-Bold.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, boldBytes, null);
        } catch (Exception e) {
            log.warn("Không thể nạp font tiếng Việt Be Vietnam Pro từ classpath, dùng font mặc định: {}", e.getMessage());
            try {
                regularBaseFont = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
                boldBaseFont = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
            } catch (Exception ex) {
                throw new IllegalStateException("Lỗi khởi tạo font PDF", ex);
            }
        }
    }

    public Font font(float size, int style, Color color) {
        initFonts();
        BaseFont bf = (style == Font.BOLD) ? boldBaseFont : regularBaseFont;
        return new Font(bf, size, style, color);
    }

    public void addMetaRow(PdfPTable table, String label1, String val1, String label2, String val2) {
        PdfPCell c1 = new PdfPCell();
        c1.setBorderColor(new Color(220, 224, 230));
        c1.setPadding(5);
        c1.addElement(new Paragraph(label1, font(8.5f, Font.BOLD, Color.GRAY)));
        c1.addElement(new Paragraph(val1, font(9.5f, Font.NORMAL, Color.BLACK)));
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell();
        c2.setBorderColor(new Color(220, 224, 230));
        c2.setPadding(5);
        c2.addElement(new Paragraph(label2, font(8.5f, Font.BOLD, Color.GRAY)));
        c2.addElement(new Paragraph(val2, font(9.5f, Font.NORMAL, Color.BLACK)));
        table.addCell(c2);
    }

    public void addKpiCell(PdfPTable table, String label, String value, Color valColor) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(new Color(248, 249, 250));
        cell.setBorderColor(new Color(220, 224, 230));
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        Paragraph pLabel = new Paragraph(label, font(8f, Font.NORMAL, Color.GRAY));
        pLabel.setAlignment(Element.ALIGN_CENTER);
        Paragraph pVal = new Paragraph(value, font(13f, Font.BOLD, valColor));
        pVal.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(pLabel);
        cell.addElement(pVal);
        table.addCell(cell);
    }

    public void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font(9f, Font.BOLD, Color.WHITE)));
        cell.setBackgroundColor(new Color(31, 58, 95));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(5);
        table.addCell(cell);
    }

    public void addBodyCell(PdfPTable table, String text, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font(8.5f, Font.NORMAL, Color.BLACK)));
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(4);
        cell.setBorderColor(new Color(230, 235, 240));
        table.addCell(cell);
    }

    public void addTableRow(PdfPTable table, String label, String value) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, font(9f, Font.BOLD, Color.DARK_GRAY)));
        c1.setBackgroundColor(new Color(245, 247, 250));
        c1.setPadding(5);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(value != null ? value : "", font(9f, Font.NORMAL, Color.BLACK)));
        c2.setPadding(5);
        table.addCell(c2);
    }

    public String str(Object val) {
        return val != null ? String.valueOf(val) : "—";
    }

    public String formatDate(Object val) {
        if (val instanceof LocalDate d) return d.format(DATE_FMT);
        if (val instanceof java.sql.Date d) return d.toLocalDate().format(DATE_FMT);
        return val != null ? String.valueOf(val) : "—";
    }

    public String formatInstant(Object val) {
        if (val instanceof Instant i) return DATETIME_FMT.format(i.atZone(VN_ZONE));
        if (val instanceof java.sql.Timestamp ts) return DATETIME_FMT.format(ts.toInstant().atZone(VN_ZONE));
        return val != null ? String.valueOf(val) : "—";
    }

    public String statusLabel(String status) {
        if (status == null) return "—";
        return switch (status) {
            case "ASSIGNED" -> "Đã phân công";
            case "IN_PROGRESS" -> "Đang chấm";
            case "SUBMITTED" -> "Đã gửi";
            case "AWAITING_ACK" -> "Chờ CHT xác nhận";
            case "COMPLETED" -> "Hoàn thành";
            case "CANCELLED" -> "Đã huỷ";
            case "OPEN" -> "Mở";
            case "CONFIRMED" -> "Đã xác nhận";
            case "APPEALED" -> "Đang khiếu nại";
            case "APPEAL_MEETING" -> "Chờ họp khiếu nại";
            case "REMEDIATING" -> "Đang khắc phục";
            case "PENDING_VERIFICATION" -> "Chờ nghiệm thu";
            case "CLOSED" -> "Đã đóng (Đạt)";
            case "DISMISSED" -> "Đã huỷ bỏ";
            default -> status;
        };
    }
}

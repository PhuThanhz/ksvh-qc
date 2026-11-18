package vn.ksvh.qc.report.service.pdf;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class PdfM4AlertExporter {

    private final JdbcTemplate jdbc;
    private final PdfLayoutSupport layout;

    public byte[] generateM4AlertPdf(Long findingId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT f.id, f.inspection_id, f.restaurant_id, f.criterion_id, f.base_impact,
                       f.violation_count, f.calculated_score, f.risk_level_code, f.risk_level_name,
                       f.deadline_date, f.status, f.description, f.evidence_urls, f.created_at,
                       r.code as rest_code, r.name as rest_name, r.address as rest_address,
                       c.name as comp_name,
                       m.full_name as store_manager_name,
                       i.code as inspection_code,
                       u.full_name as inspector_name,
                       it.criterion_code, it.criterion_name, it.group_name
                FROM findings f
                JOIN org_units r ON f.restaurant_id = r.id
                JOIN companies c ON r.company_id = c.id
                LEFT JOIN users m ON r.store_manager_user_id = m.id
                JOIN inspections i ON f.inspection_id = i.id
                JOIN users u ON i.inspector_id = u.id
                JOIN inspection_items it ON f.inspection_item_id = it.id
                WHERE f.id = ?
                """, findingId);

        if (rows.isEmpty()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy lỗi vi phạm #" + findingId);
        }
        Map<String, Object> f = rows.get(0);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 40, 40, 36, 36);

        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            // 1. Quốc hiệu tiêu ngữ
            Paragraph header = new Paragraph();
            header.setAlignment(Element.ALIGN_CENTER);
            header.add(new Chunk("HỆ THỐNG KIỂM SOÁT VẬN HÀNH (KSVH QC)\n", layout.font(11, Font.BOLD, new Color(31, 58, 95))));
            header.add(new Chunk("CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n", layout.font(10, Font.BOLD, Color.DARK_GRAY)));
            header.add(new Chunk("----------------------------------------\n\n", layout.font(9, Font.NORMAL, Color.GRAY)));
            document.add(header);

            // 2. Tiêu đề cảnh báo M4
            Paragraph alertTitle = new Paragraph("BIÊN BẢN GHI NHẬN SỰ CỐ / VI PHẠM ĐẶC BIỆT NGHIÊM TRỌNG",
                    layout.font(14, Font.BOLD, new Color(207, 19, 34)));
            alertTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(alertTitle);

            Paragraph alertSub = new Paragraph("(PHÂN LOẠI MỨC ĐỘ RỦI RO M4)", layout.font(12, Font.BOLD, new Color(207, 19, 34)));
            alertSub.setAlignment(Element.ALIGN_CENTER);
            alertSub.setSpacingAfter(14);
            document.add(alertSub);

            // Box cảnh báo đỏ
            PdfPTable alertBox = new PdfPTable(1);
            alertBox.setWidthPercentage(100);
            alertBox.setSpacingAfter(12);
            PdfPCell alertCell = new PdfPCell(new Phrase("CẢNH BÁO KHẨN CẤP: Lỗi vi phạm thuộc mức độ M4 có nguy cơ trực tiếp gây ngộ độc thực phẩm, mất an toàn tính mạng, đình chỉ hoạt động cơ sở hoặc ảnh hưởng nghiêm trọng tới thương hiệu. Yêu cầu Cửa hàng trưởng và các bên liên quan khẩn trương xử lý theo quy định khẩn cấp.",
                    layout.font(9.5f, Font.BOLD, new Color(168, 7, 26))));
            alertCell.setBackgroundColor(new Color(255, 241, 240));
            alertCell.setBorderColor(new Color(255, 163, 158));
            alertCell.setPadding(8);
            alertBox.addCell(alertCell);
            document.add(alertBox);

            // 3. Thông tin chung
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(12);
            addMetaCell(infoTable, "Nhà hàng vi phạm:", layout.str(f.get("rest_name")) + " (" + layout.str(f.get("rest_code")) + ")",
                    "Công ty:", layout.str(f.get("comp_name")));
            addMetaCell(infoTable, "Địa chỉ:", layout.str(f.get("rest_address")), "Cửa hàng trưởng:", layout.str(f.get("store_manager_name")));
            addMetaCell(infoTable, "Chuyên viên phát hiện:", layout.str(f.get("inspector_name")), "Phiếu kiểm tra:", layout.str(f.get("inspection_code")));
            addMetaCell(infoTable, "Thời điểm phát hiện:", layout.formatInstant(f.get("created_at")), "Hạn khắc phục:", layout.formatDate(f.get("deadline_date")));
            document.add(infoTable);

            // 4. Chi tiết vi phạm
            Paragraph pSec = new Paragraph("CHI TIẾT VI PHẠM & ĐÁNH GIÁ RỦI RO", layout.font(11, Font.BOLD, new Color(31, 58, 95)));
            pSec.setSpacingAfter(6);
            document.add(pSec);

            PdfPTable vTable = new PdfPTable(new float[]{30, 70});
            vTable.setWidthPercentage(100);
            vTable.setSpacingAfter(14);

            layout.addTableRow(vTable, "Nhóm tiêu chí:", layout.str(f.get("group_name")));
            layout.addTableRow(vTable, "Tiêu chí vi phạm:", layout.str(f.get("criterion_name")) + " (" + layout.str(f.get("criterion_code")) + ")");
            layout.addTableRow(vTable, "Mức độ rủi ro:", "M4 - ĐẶC BIỆT NGHIÊM TRỌNG");
            layout.addTableRow(vTable, "Điểm rủi ro tính toán:", layout.str(f.get("calculated_score")) + " điểm (Mức ảnh hưởng gốc: " + layout.str(f.get("base_impact")) + ")");
            layout.addTableRow(vTable, "Mô tả vi phạm thực tế:", layout.str(f.get("description")));
            document.add(vTable);

            // 5. Yêu cầu xử lý
            Paragraph pAction = new Paragraph("YÊU CẦU XỬ LÝ KHẨN CẤP", layout.font(11, Font.BOLD, new Color(31, 58, 95)));
            pAction.setSpacingAfter(6);
            document.add(pAction);

            Paragraph pReq = new Paragraph("1. Cửa hàng trưởng lập tức dừng ngay hành vi vi phạm hoặc đình chỉ khu vực / thiết bị vi phạm.\n" +
                    "2. Thực hiện biện pháp khắc phục trong vòng 24 GIỜ (Hạn chót: " + layout.formatDate(f.get("deadline_date")) + ").\n" +
                    "3. Gửi hình ảnh / video minh chứng đã khắc phục lên phần mềm để Chuyên viên KSVH nghiệm thu.\n" +
                    "4. Báo cáo bằng văn bản giải trình gửi Giám đốc Vận hành (OBM) và Phòng KSVH.", layout.font(9.5f, Font.NORMAL, Color.BLACK));
            pReq.setSpacingAfter(16);
            document.add(pReq);

            // 6. Ký tên
            PdfPTable signTable = new PdfPTable(2);
            signTable.setWidthPercentage(100);
            signTable.setKeepTogether(true);

            PdfPCell signLeft = new PdfPCell();
            signLeft.setBorder(Rectangle.NO_BORDER);
            signLeft.setHorizontalAlignment(Element.ALIGN_CENTER);
            signLeft.addElement(new Paragraph("ĐẠI DIỆN NHÀ HÀNG (CHT)\n(Ký, ghi rõ họ tên & cam kết khắc phục)\n\n\n\n\n", layout.font(9.5f, Font.BOLD, Color.BLACK)));
            signLeft.addElement(new Paragraph(layout.str(f.get("store_manager_name")), layout.font(9.5f, Font.NORMAL, Color.DARK_GRAY)));

            PdfPCell signRight = new PdfPCell();
            signRight.setBorder(Rectangle.NO_BORDER);
            signRight.setHorizontalAlignment(Element.ALIGN_CENTER);
            signRight.addElement(new Paragraph("CHUYÊN VIÊN KSVH LẬP BIÊN BẢN\n(Ký và ghi rõ họ tên)\n\n\n\n\n", layout.font(9.5f, Font.BOLD, Color.BLACK)));
            signRight.addElement(new Paragraph(layout.str(f.get("inspector_name")), layout.font(9.5f, Font.NORMAL, Color.DARK_GRAY)));

            signTable.addCell(signLeft);
            signTable.addCell(signRight);
            document.add(signTable);

            document.close();
            return baos.toByteArray();
        } catch (DocumentException e) {
            throw new IllegalStateException("Lỗi tạo file PDF biên bản M4", e);
        }
    }

    private void addMetaCell(PdfPTable table, String label1, String val1, String label2, String val2) {
        PdfPCell c1 = new PdfPCell();
        c1.setBorder(Rectangle.NO_BORDER);
        c1.addElement(new Paragraph(label1, layout.font(8.5f, Font.BOLD, Color.GRAY)));
        c1.addElement(new Paragraph(val1, layout.font(9.5f, Font.NORMAL, Color.BLACK)));
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell();
        c2.setBorder(Rectangle.NO_BORDER);
        c2.addElement(new Paragraph(label2, layout.font(8.5f, Font.BOLD, Color.GRAY)));
        c2.addElement(new Paragraph(val2, layout.font(9.5f, Font.NORMAL, Color.BLACK)));
        table.addCell(c2);
    }
}

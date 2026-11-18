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
public class PdfInspectionExporter {

    private final JdbcTemplate jdbc;
    private final PdfLayoutSupport layout;

    public byte[] generateInspectionPdf(Long inspectionId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT i.id, i.code, i.inspection_type, i.status, i.checkin_lat, i.checkin_lng, i.checkin_distance_m,
                       i.checkin_at, i.submitted_at, i.completed_at, i.notes,
                       r.id as rest_id, r.code as rest_code, r.name as rest_name, r.address as rest_address,
                       c.name as comp_name,
                       u.id as inspector_id, u.username as inspector_username, u.full_name as inspector_name,
                       m.full_name as store_manager_name,
                       t.name as template_name
                FROM inspections i
                JOIN org_units r ON i.restaurant_id = r.id
                JOIN companies c ON r.company_id = c.id
                JOIN users u ON i.inspector_id = u.id
                LEFT JOIN users m ON r.store_manager_user_id = m.id
                JOIN inspection_templates t ON i.template_id = t.id
                WHERE i.id = ?
                """, inspectionId);

        if (rows.isEmpty()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy phiếu kiểm tra #" + inspectionId);
        }
        Map<String, Object> ins = rows.get(0);

        List<Map<String, Object>> items = jdbc.queryForList("""
                SELECT it.id, it.sort_order, it.group_name, it.criterion_code, it.criterion_name,
                       it.base_impact, it.result, it.comment
                FROM inspection_items it
                WHERE it.inspection_id = ?
                ORDER BY it.sort_order ASC, it.id ASC
                """, inspectionId);

        List<Map<String, Object>> findings = jdbc.queryForList("""
                SELECT f.id, f.base_impact, f.violation_count, f.calculated_score,
                       f.risk_level_code, f.risk_level_name, f.deadline_date, f.status, f.description,
                       it.criterion_name
                FROM findings f
                JOIN inspection_items it ON f.inspection_item_id = it.id
                WHERE f.inspection_id = ?
                ORDER BY f.calculated_score DESC, f.id ASC
                """, inspectionId);

        long passCount = items.stream().filter(it -> "PASS".equals(it.get("result"))).count();
        long failCount = items.stream().filter(it -> "FAIL".equals(it.get("result"))).count();
        long naCount = items.stream().filter(it -> "NA".equals(it.get("result"))).count();
        long totalRated = passCount + failCount;
        double complianceRate = totalRated > 0 ? (passCount * 100.0 / totalRated) : 100.0;

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);

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

            // 2. Tiêu đề phiếu
            Paragraph title = new Paragraph("BIÊN BẢN KIỂM TRA KIỂM SOÁT VẬN HÀNH", layout.font(15, Font.BOLD, new Color(31, 58, 95)));
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(14);
            document.add(title);

            // 3. Thông tin chung (bảng 2 cột)
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            metaTable.setSpacingAfter(12);

            String insType = layout.str(ins.get("inspection_type"));
            String insTypeDisplay = "PERIODIC".equalsIgnoreCase(insType) ? "Định kỳ" : ("SURPRISE".equalsIgnoreCase(insType) ? "Đột xuất" : insType);
            addMetaCell(metaTable, "Mã phiếu:", layout.str(ins.get("code")), "Loại kiểm tra:", insTypeDisplay);
            addMetaCell(metaTable, "Nhà hàng:", layout.str(ins.get("rest_name")) + " (" + layout.str(ins.get("rest_code")) + ")",
                    "Công ty:", layout.str(ins.get("comp_name")));
            addMetaCell(metaTable, "Địa chỉ:", layout.str(ins.get("rest_address")), "Cửa hàng trưởng:", layout.str(ins.get("store_manager_name")));
            addMetaCell(metaTable, "Chuyên viên chấm:", layout.str(ins.get("inspector_name")), "Trạng thái:", layout.statusLabel(layout.str(ins.get("status"))));
            addMetaCell(metaTable, "Thời điểm gửi:", layout.formatInstant(ins.get("submitted_at")), "Mẫu phiếu:", layout.str(ins.get("template_name")));

            Double dist = (Double) ins.get("checkin_distance_m");
            String gpsInfo = dist != null ? String.format("%.0f m (Hợp lệ)", dist) : "Không ghi nhận";
            addMetaCell(metaTable, "Check-in GPS:", gpsInfo, "Ghi chú:", layout.str(ins.get("notes")));
            document.add(metaTable);

            // 4. Khung Tóm tắt kết quả
            PdfPTable kpiTable = new PdfPTable(5);
            kpiTable.setWidthPercentage(100);
            kpiTable.setSpacingAfter(14);
            layout.addKpiCell(kpiTable, "% Tuân thủ", String.format("%.1f%%", complianceRate), new Color(22, 119, 255));
            layout.addKpiCell(kpiTable, "Tiêu chí ĐẠT", String.valueOf(passCount), new Color(82, 196, 26));
            layout.addKpiCell(kpiTable, "Tiêu chí LỖI", String.valueOf(failCount), new Color(255, 77, 79));
            layout.addKpiCell(kpiTable, "Tiêu chí N/A", String.valueOf(naCount), Color.GRAY);
            layout.addKpiCell(kpiTable, "Tổng số lỗi", String.valueOf(findings.size()), new Color(250, 140, 22));
            document.add(kpiTable);

            // 5. Bảng chi tiết kết quả đánh giá tiêu chí
            Paragraph secItems = new Paragraph("I. CHI TIẾT ĐÁNH GIÁ CÁC TIÊU CHÍ", layout.font(11, Font.BOLD, new Color(31, 58, 95)));
            secItems.setSpacingAfter(6);
            document.add(secItems);

            PdfPTable itemTable = new PdfPTable(new float[]{8, 18, 42, 14, 18});
            itemTable.setWidthPercentage(100);
            itemTable.setSpacingAfter(14);

            layout.addHeaderCell(itemTable, "STT");
            layout.addHeaderCell(itemTable, "Mã");
            layout.addHeaderCell(itemTable, "Tiêu chí");
            layout.addHeaderCell(itemTable, "Kết quả");
            layout.addHeaderCell(itemTable, "Ghi chú");

            int idx = 1;
            for (Map<String, Object> it : items) {
                layout.addBodyCell(itemTable, String.valueOf(idx++), Element.ALIGN_CENTER);
                layout.addBodyCell(itemTable, layout.str(it.get("criterion_code")), Element.ALIGN_LEFT);
                layout.addBodyCell(itemTable, layout.str(it.get("criterion_name")), Element.ALIGN_LEFT);
                String res = layout.str(it.get("result"));
                Color resColor = "PASS".equals(res) ? new Color(56, 158, 13) : ("FAIL".equals(res) ? Color.RED : Color.GRAY);
                String resText = "PASS".equals(res) ? "ĐẠT" : ("FAIL".equals(res) ? "KHÔNG ĐẠT" : ("NA".equals(res) ? "N/A" : "Chưa chấm"));
                PdfPCell c = new PdfPCell(new Phrase(resText, layout.font(8.5f, Font.BOLD, resColor)));
                c.setHorizontalAlignment(Element.ALIGN_CENTER);
                c.setPadding(4);
                itemTable.addCell(c);
                layout.addBodyCell(itemTable, layout.str(it.get("comment")), Element.ALIGN_LEFT);
            }
            document.add(itemTable);

            // 6. Bảng danh sách lỗi phát hiện (nếu có)
            if (!findings.isEmpty()) {
                Paragraph secFindings = new Paragraph("II. DANH SÁCH LỖI VI PHẠM CẦN KHẮC PHỤC", layout.font(11, Font.BOLD, new Color(207, 19, 34)));
                secFindings.setSpacingAfter(6);
                document.add(secFindings);

                PdfPTable findTable = new PdfPTable(new float[]{8, 38, 14, 14, 14, 12});
                findTable.setWidthPercentage(100);
                findTable.setSpacingAfter(14);

                layout.addHeaderCell(findTable, "STT");
                layout.addHeaderCell(findTable, "Tiêu chí vi phạm");
                layout.addHeaderCell(findTable, "Mức rủi ro");
                layout.addHeaderCell(findTable, "Điểm rủi ro");
                layout.addHeaderCell(findTable, "Hạn khắc phục");
                layout.addHeaderCell(findTable, "Trạng thái");

                int fIdx = 1;
                for (Map<String, Object> f : findings) {
                    layout.addBodyCell(findTable, String.valueOf(fIdx++), Element.ALIGN_CENTER);
                    layout.addBodyCell(findTable, layout.str(f.get("criterion_name")), Element.ALIGN_LEFT);
                    String rCode = layout.str(f.get("risk_level_code"));
                    Color rColor = "M4".equalsIgnoreCase(rCode) ? Color.RED : ("M3".equalsIgnoreCase(rCode) ? new Color(250, 84, 28) : Color.DARK_GRAY);
                    PdfPCell rc = new PdfPCell(new Phrase(rCode + " (" + layout.str(f.get("risk_level_name")) + ")", layout.font(8.5f, Font.BOLD, rColor)));
                    rc.setPadding(4);
                    findTable.addCell(rc);
                    layout.addBodyCell(findTable, layout.str(f.get("calculated_score")), Element.ALIGN_CENTER);
                    layout.addBodyCell(findTable, layout.formatDate(f.get("deadline_date")), Element.ALIGN_CENTER);
                    layout.addBodyCell(findTable, layout.statusLabel(layout.str(f.get("status"))), Element.ALIGN_CENTER);
                }
                document.add(findTable);
            }

            // 7. Khu vực ký tên
            PdfPTable signTable = new PdfPTable(2);
            signTable.setWidthPercentage(100);
            signTable.setKeepTogether(true);
            signTable.setSpacingBefore(18);

            PdfPCell signLeft = new PdfPCell();
            signLeft.setBorder(Rectangle.NO_BORDER);
            signLeft.setHorizontalAlignment(Element.ALIGN_CENTER);
            signLeft.addElement(new Paragraph("ĐẠI DIỆN NHÀ HÀNG (CHT)\n(Ký và ghi rõ họ tên)\n\n\n\n\n", layout.font(9.5f, Font.BOLD, Color.BLACK)));
            signLeft.addElement(new Paragraph(layout.str(ins.get("store_manager_name")), layout.font(9.5f, Font.NORMAL, Color.DARK_GRAY)));

            PdfPCell signRight = new PdfPCell();
            signRight.setBorder(Rectangle.NO_BORDER);
            signRight.setHorizontalAlignment(Element.ALIGN_CENTER);
            signRight.addElement(new Paragraph("CHUYÊN VIÊN KSVH\n(Ký và ghi rõ họ tên)\n\n\n\n\n", layout.font(9.5f, Font.BOLD, Color.BLACK)));
            signRight.addElement(new Paragraph(layout.str(ins.get("inspector_name")), layout.font(9.5f, Font.NORMAL, Color.DARK_GRAY)));

            signTable.addCell(signLeft);
            signTable.addCell(signRight);
            document.add(signTable);

            document.close();
            return baos.toByteArray();
        } catch (DocumentException e) {
            throw new IllegalStateException("Lỗi tạo file PDF phiếu chấm", e);
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

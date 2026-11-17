package vn.ksvh.qc.report.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StreamUtils;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PdfExportService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final JdbcTemplate jdbc;

    private BaseFont regularBaseFont;
    private BaseFont boldBaseFont;

    private synchronized void initFonts() {
        if (regularBaseFont != null && boldBaseFont != null) {
            return;
        }
        try {
            ClassPathResource regRes = new ClassPathResource("fonts/Arial.ttf");
            byte[] regBytes = StreamUtils.copyToByteArray(regRes.getInputStream());
            regularBaseFont = BaseFont.createFont("Arial.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, regBytes, null);

            ClassPathResource boldRes = new ClassPathResource("fonts/Arial-Bold.ttf");
            byte[] boldBytes = StreamUtils.copyToByteArray(boldRes.getInputStream());
            boldBaseFont = BaseFont.createFont("Arial-Bold.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, boldBytes, null);
        } catch (Exception e) {
            log.warn("Không thể nạp font tiếng Việt Arial từ classpath, dùng font mặc định: {}", e.getMessage());
            try {
                regularBaseFont = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
                boldBaseFont = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
            } catch (Exception ex) {
                throw new IllegalStateException("Lỗi khởi tạo font PDF", ex);
            }
        }
    }

    private Font font(float size, int style, Color color) {
        initFonts();
        BaseFont bf = (style == Font.BOLD) ? boldBaseFont : regularBaseFont;
        return new Font(bf, size, style, color);
    }

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
            header.add(new Chunk("HỆ THỐNG KIỂM SOÁT VẬN HÀNH (KSVH QC)\n", font(11, Font.BOLD, new Color(31, 58, 95))));
            header.add(new Chunk("CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n", font(10, Font.BOLD, Color.DARK_GRAY)));
            header.add(new Chunk("----------------------------------------\n\n", font(9, Font.NORMAL, Color.GRAY)));
            document.add(header);

            // 2. Tiêu đề phiếu
            Paragraph title = new Paragraph("BIÊN BẢN KIỂM TRA KIỂM SOÁT VẬN HÀNH", font(15, Font.BOLD, new Color(31, 58, 95)));
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(14);
            document.add(title);

            // 3. Thông tin chung (bảng 2 cột)
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            metaTable.setSpacingAfter(12);

            String insType = str(ins.get("inspection_type"));
            String insTypeDisplay = "PERIODIC".equalsIgnoreCase(insType) ? "Định kỳ" : ("SURPRISE".equalsIgnoreCase(insType) ? "Đột xuất" : insType);
            addMetaCell(metaTable, "Mã phiếu:", str(ins.get("code")), "Loại kiểm tra:", insTypeDisplay);
            addMetaCell(metaTable, "Nhà hàng:", str(ins.get("rest_name")) + " (" + str(ins.get("rest_code")) + ")",
                    "Công ty:", str(ins.get("comp_name")));
            addMetaCell(metaTable, "Địa chỉ:", str(ins.get("rest_address")), "Cửa hàng trưởng:", str(ins.get("store_manager_name")));
            addMetaCell(metaTable, "Chuyên viên chấm:", str(ins.get("inspector_name")), "Trạng thái:", statusLabel(str(ins.get("status"))));
            addMetaCell(metaTable, "Thời điểm gửi:", formatInstant(ins.get("submitted_at")), "Mẫu phiếu:", str(ins.get("template_name")));

            Double dist = (Double) ins.get("checkin_distance_m");
            String gpsInfo = dist != null ? String.format("%.0f m (Hợp lệ)", dist) : "Không ghi nhận";
            addMetaCell(metaTable, "Check-in GPS:", gpsInfo, "Ghi chú:", str(ins.get("notes")));
            document.add(metaTable);

            // 4. Khung Tóm tắt kết quả
            PdfPTable kpiTable = new PdfPTable(5);
            kpiTable.setWidthPercentage(100);
            kpiTable.setSpacingAfter(14);
            addKpiCell(kpiTable, "% Tuân thủ", String.format("%.1f%%", complianceRate), new Color(22, 119, 255));
            addKpiCell(kpiTable, "Tiêu chí ĐẠT", String.valueOf(passCount), new Color(82, 196, 26));
            addKpiCell(kpiTable, "Tiêu chí LỖI", String.valueOf(failCount), new Color(255, 77, 79));
            addKpiCell(kpiTable, "Tiêu chí N/A", String.valueOf(naCount), Color.GRAY);
            addKpiCell(kpiTable, "Tổng số lỗi", String.valueOf(findings.size()), new Color(250, 140, 22));
            document.add(kpiTable);

            // 5. Bảng chi tiết kết quả đánh giá tiêu chí
            Paragraph secItems = new Paragraph("I. CHI TIẾT ĐÁNH GIÁ CÁC TIÊU CHÍ", font(11, Font.BOLD, new Color(31, 58, 95)));
            secItems.setSpacingAfter(6);
            document.add(secItems);

            PdfPTable itemTable = new PdfPTable(new float[]{8, 18, 42, 14, 18});
            itemTable.setWidthPercentage(100);
            itemTable.setSpacingAfter(14);

            addHeaderCell(itemTable, "STT");
            addHeaderCell(itemTable, "Mã");
            addHeaderCell(itemTable, "Tiêu chí");
            addHeaderCell(itemTable, "Kết quả");
            addHeaderCell(itemTable, "Ghi chú");

            int idx = 1;
            for (Map<String, Object> it : items) {
                addBodyCell(itemTable, String.valueOf(idx++), Element.ALIGN_CENTER);
                addBodyCell(itemTable, str(it.get("criterion_code")), Element.ALIGN_LEFT);
                addBodyCell(itemTable, str(it.get("criterion_name")), Element.ALIGN_LEFT);
                String res = str(it.get("result"));
                Color resColor = "PASS".equals(res) ? new Color(56, 158, 13) : ("FAIL".equals(res) ? Color.RED : Color.GRAY);
                String resText = "PASS".equals(res) ? "ĐẠT" : ("FAIL".equals(res) ? "KHÔNG ĐẠT" : ("NA".equals(res) ? "N/A" : "Chưa chấm"));
                PdfPCell c = new PdfPCell(new Phrase(resText, font(8.5f, Font.BOLD, resColor)));
                c.setHorizontalAlignment(Element.ALIGN_CENTER);
                c.setPadding(4);
                itemTable.addCell(c);
                addBodyCell(itemTable, str(it.get("comment")), Element.ALIGN_LEFT);
            }
            document.add(itemTable);

            // 6. Bảng danh sách lỗi phát hiện (nếu có)
            if (!findings.isEmpty()) {
                Paragraph secFindings = new Paragraph("II. DANH SÁCH LỖI VI PHẠM CẦN KHẮC PHỤC", font(11, Font.BOLD, new Color(207, 19, 34)));
                secFindings.setSpacingAfter(6);
                document.add(secFindings);

                PdfPTable findTable = new PdfPTable(new float[]{8, 38, 14, 14, 14, 12});
                findTable.setWidthPercentage(100);
                findTable.setSpacingAfter(14);

                addHeaderCell(findTable, "STT");
                addHeaderCell(findTable, "Tiêu chí vi phạm");
                addHeaderCell(findTable, "Mức rủi ro");
                addHeaderCell(findTable, "Điểm rủi ro");
                addHeaderCell(findTable, "Hạn khắc phục");
                addHeaderCell(findTable, "Trạng thái");

                int fIdx = 1;
                for (Map<String, Object> f : findings) {
                    addBodyCell(findTable, String.valueOf(fIdx++), Element.ALIGN_CENTER);
                    addBodyCell(findTable, str(f.get("criterion_name")), Element.ALIGN_LEFT);
                    String rCode = str(f.get("risk_level_code"));
                    Color rColor = "M4".equalsIgnoreCase(rCode) ? Color.RED : ("M3".equalsIgnoreCase(rCode) ? new Color(250, 84, 28) : Color.DARK_GRAY);
                    PdfPCell rc = new PdfPCell(new Phrase(rCode + " (" + str(f.get("risk_level_name")) + ")", font(8.5f, Font.BOLD, rColor)));
                    rc.setPadding(4);
                    findTable.addCell(rc);
                    addBodyCell(findTable, str(f.get("calculated_score")), Element.ALIGN_CENTER);
                    addBodyCell(findTable, formatDate(f.get("deadline_date")), Element.ALIGN_CENTER);
                    addBodyCell(findTable, statusLabel(str(f.get("status"))), Element.ALIGN_CENTER);
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
            signLeft.addElement(new Paragraph("ĐẠI DIỆN NHÀ HÀNG (CHT)\n(Ký và ghi rõ họ tên)\n\n\n\n\n", font(9.5f, Font.BOLD, Color.BLACK)));
            signLeft.addElement(new Paragraph(str(ins.get("store_manager_name")), font(9.5f, Font.NORMAL, Color.DARK_GRAY)));

            PdfPCell signRight = new PdfPCell();
            signRight.setBorder(Rectangle.NO_BORDER);
            signRight.setHorizontalAlignment(Element.ALIGN_CENTER);
            signRight.addElement(new Paragraph("CHUYÊN VIÊN KSVH\n(Ký và ghi rõ họ tên)\n\n\n\n\n", font(9.5f, Font.BOLD, Color.BLACK)));
            signRight.addElement(new Paragraph(str(ins.get("inspector_name")), font(9.5f, Font.NORMAL, Color.DARK_GRAY)));

            signTable.addCell(signLeft);
            signTable.addCell(signRight);
            document.add(signTable);

            document.close();
            return baos.toByteArray();
        } catch (DocumentException e) {
            throw new IllegalStateException("Lỗi tạo file PDF phiếu chấm", e);
        }
    }

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
            header.add(new Chunk("HỆ THỐNG KIỂM SOÁT VẬN HÀNH (KSVH QC)\n", font(11, Font.BOLD, new Color(31, 58, 95))));
            header.add(new Chunk("CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n", font(10, Font.BOLD, Color.DARK_GRAY)));
            header.add(new Chunk("----------------------------------------\n\n", font(9, Font.NORMAL, Color.GRAY)));
            document.add(header);

            // 2. Tiêu đề cảnh báo M4
            Paragraph alertTitle = new Paragraph("BIÊN BẢN GHI NHẬN SỰ CỐ / VI PHẠM ĐẶC BIỆT NGHIÊM TRỌNG",
                    font(14, Font.BOLD, new Color(207, 19, 34)));
            alertTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(alertTitle);

            Paragraph alertSub = new Paragraph("(PHÂN LOẠI MỨC ĐỘ RỦI RO M4)", font(12, Font.BOLD, new Color(207, 19, 34)));
            alertSub.setAlignment(Element.ALIGN_CENTER);
            alertSub.setSpacingAfter(14);
            document.add(alertSub);

            // Box cảnh báo đỏ
            PdfPTable alertBox = new PdfPTable(1);
            alertBox.setWidthPercentage(100);
            alertBox.setSpacingAfter(12);
            PdfPCell alertCell = new PdfPCell(new Phrase("CẢNH BÁO KHẨN CẤP: Lỗi vi phạm thuộc mức độ M4 có nguy cơ trực tiếp gây ngộ độc thực phẩm, mất an toàn tính mạng, đình chỉ hoạt động cơ sở hoặc ảnh hưởng nghiêm trọng tới thương hiệu. Yêu cầu Cửa hàng trưởng và các bên liên quan khẩn trương xử lý theo quy định khẩn cấp.",
                    font(9.5f, Font.BOLD, new Color(168, 7, 26))));
            alertCell.setBackgroundColor(new Color(255, 241, 240));
            alertCell.setBorderColor(new Color(255, 163, 158));
            alertCell.setPadding(8);
            alertBox.addCell(alertCell);
            document.add(alertBox);

            // 3. Thông tin chung
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(12);
            addMetaCell(infoTable, "Nhà hàng vi phạm:", str(f.get("rest_name")) + " (" + str(f.get("rest_code")) + ")",
                    "Công ty:", str(f.get("comp_name")));
            addMetaCell(infoTable, "Địa chỉ:", str(f.get("rest_address")), "Cửa hàng trưởng:", str(f.get("store_manager_name")));
            addMetaCell(infoTable, "Chuyên viên phát hiện:", str(f.get("inspector_name")), "Phiếu kiểm tra:", str(f.get("inspection_code")));
            addMetaCell(infoTable, "Thời điểm phát hiện:", formatInstant(f.get("created_at")), "Hạn khắc phục:", formatDate(f.get("deadline_date")));
            document.add(infoTable);

            // 4. Chi tiết vi phạm
            Paragraph pSec = new Paragraph("CHI TIẾT VI PHẠM & ĐÁNH GIÁ RỦI RO", font(11, Font.BOLD, new Color(31, 58, 95)));
            pSec.setSpacingAfter(6);
            document.add(pSec);

            PdfPTable vTable = new PdfPTable(new float[]{30, 70});
            vTable.setWidthPercentage(100);
            vTable.setSpacingAfter(14);

            addTableRow(vTable, "Nhóm tiêu chí:", str(f.get("group_name")));
            addTableRow(vTable, "Tiêu chí vi phạm:", str(f.get("criterion_name")) + " (" + str(f.get("criterion_code")) + ")");
            addTableRow(vTable, "Mức độ rủi ro:", "M4 - ĐẶC BIỆT NGHIÊM TRỌNG");
            addTableRow(vTable, "Điểm rủi ro tính toán:", str(f.get("calculated_score")) + " điểm (Mức ảnh hưởng gốc: " + str(f.get("base_impact")) + ")");
            addTableRow(vTable, "Mô tả vi phạm thực tế:", str(f.get("description")));
            document.add(vTable);

            // 5. Yêu cầu xử lý
            Paragraph pAction = new Paragraph("YÊU CẦU XỬ LÝ KHẨN CẤP", font(11, Font.BOLD, new Color(31, 58, 95)));
            pAction.setSpacingAfter(6);
            document.add(pAction);

            Paragraph pReq = new Paragraph("1. Cửa hàng trưởng lập tức dừng ngay hành vi vi phạm hoặc đình chỉ khu vực / thiết bị vi phạm.\n" +
                    "2. Thực hiện biện pháp khắc phục trong vòng 24 GIỜ (Hạn chót: " + formatDate(f.get("deadline_date")) + ").\n" +
                    "3. Gửi hình ảnh / video minh chứng đã khắc phục lên phần mềm để Chuyên viên KSVH nghiệm thu.\n" +
                    "4. Báo cáo bằng văn bản giải trình gửi Giám đốc Vận hành (OBM) và Phòng KSVH.", font(9.5f, Font.NORMAL, Color.BLACK));
            pReq.setSpacingAfter(16);
            document.add(pReq);

            // 6. Ký tên
            PdfPTable signTable = new PdfPTable(2);
            signTable.setWidthPercentage(100);
            signTable.setKeepTogether(true);

            PdfPCell signLeft = new PdfPCell();
            signLeft.setBorder(Rectangle.NO_BORDER);
            signLeft.setHorizontalAlignment(Element.ALIGN_CENTER);
            signLeft.addElement(new Paragraph("ĐẠI DIỆN NHÀ HÀNG (CHT)\n(Ký, ghi rõ họ tên & cam kết khắc phục)\n\n\n\n\n", font(9.5f, Font.BOLD, Color.BLACK)));
            signLeft.addElement(new Paragraph(str(f.get("store_manager_name")), font(9.5f, Font.NORMAL, Color.DARK_GRAY)));

            PdfPCell signRight = new PdfPCell();
            signRight.setBorder(Rectangle.NO_BORDER);
            signRight.setHorizontalAlignment(Element.ALIGN_CENTER);
            signRight.addElement(new Paragraph("CHUYÊN VIÊN KSVH LẬP BIÊN BẢN\n(Ký và ghi rõ họ tên)\n\n\n\n\n", font(9.5f, Font.BOLD, Color.BLACK)));
            signRight.addElement(new Paragraph(str(f.get("inspector_name")), font(9.5f, Font.NORMAL, Color.DARK_GRAY)));

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
        c1.addElement(new Paragraph(label1, font(8.5f, Font.BOLD, Color.GRAY)));
        c1.addElement(new Paragraph(val1, font(9.5f, Font.NORMAL, Color.BLACK)));
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell();
        c2.setBorder(Rectangle.NO_BORDER);
        c2.addElement(new Paragraph(label2, font(8.5f, Font.BOLD, Color.GRAY)));
        c2.addElement(new Paragraph(val2, font(9.5f, Font.NORMAL, Color.BLACK)));
        table.addCell(c2);
    }

    private void addKpiCell(PdfPTable table, String label, String value, Color valColor) {
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

    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font(9f, Font.BOLD, Color.WHITE)));
        cell.setBackgroundColor(new Color(31, 58, 95));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(5);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font(8.5f, Font.NORMAL, Color.BLACK)));
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(4);
        cell.setBorderColor(new Color(230, 235, 240));
        table.addCell(cell);
    }

    private void addTableRow(PdfPTable table, String label, String value) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, font(9f, Font.BOLD, Color.DARK_GRAY)));
        c1.setBackgroundColor(new Color(245, 247, 250));
        c1.setPadding(5);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(value != null ? value : "", font(9f, Font.NORMAL, Color.BLACK)));
        c2.setPadding(5);
        table.addCell(c2);
    }

    private String str(Object val) {
        return val != null ? String.valueOf(val) : "—";
    }

    private String formatDate(Object val) {
        if (val instanceof LocalDate d) return d.format(DATE_FMT);
        if (val instanceof java.sql.Date d) return d.toLocalDate().format(DATE_FMT);
        return val != null ? String.valueOf(val) : "—";
    }

    private String formatInstant(Object val) {
        if (val instanceof Instant i) return DATETIME_FMT.format(i.atZone(VN_ZONE));
        if (val instanceof java.sql.Timestamp ts) return DATETIME_FMT.format(ts.toInstant().atZone(VN_ZONE));
        return val != null ? String.valueOf(val) : "—";
    }

    private String statusLabel(String status) {
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

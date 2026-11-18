package vn.ksvh.qc.notification.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailTemplateService {

    @Value("${app.client-url:http://localhost:5273}")
    private String clientUrl;

    public String buildHtmlEmail(String recipientName, String title, String body, String link) {
        String fullUrl = link != null && link.startsWith("http") ? link : clientUrl + (link != null ? link : "");
        String escapedBody = escapeHtml(body);
        String escapedTitle = escapeHtml(title);
        String escapedName = escapeHtml(recipientName != null ? recipientName : "Quý đồng nghiệp");

        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>%s</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f1f1f; line-height: 1.6;">
                    <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f0f2f5; padding: 30px 15px;">
                        <tr>
                            <td align="center">
                                <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background-color: #003a8c; padding: 24px 30px; text-align: left;">
                                            <div style="color: #ffffff; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">KSVH QC SYSTEM</div>
                                            <div style="color: #91caff; font-size: 13px; margin-top: 4px;">Hệ thống Kiểm soát Vận hành &amp; Quản trị Chất lượng</div>
                                        </td>
                                    </tr>
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 30px;">
                                            <div style="font-size: 15px; margin-bottom: 16px;">Kính gửi <strong>%s</strong>,</div>
                                            <div style="background-color: #e6f4ff; border-left: 4px solid #1677ff; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
                                                <div style="font-size: 16px; font-weight: 600; color: #003a8c;">%s</div>
                                            </div>
                                            <div style="font-size: 15px; color: #333333; margin-bottom: 25px; white-space: pre-line;">%s</div>
                                            <div style="text-align: center; margin: 30px 0;">
                                                <a href="%s" style="background-color: #1677ff; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">Xem chi tiết trên hệ thống</a>
                                            </div>
                                            <div style="font-size: 13px; color: #8c8c8c; border-top: 1px solid #f0f0f0; padding-top: 20px; margin-top: 20px;">
                                                Nếu nút bấm trên không hoạt động, vui lòng truy cập đường dẫn sau:<br>
                                                <a href="%s" style="color: #1677ff; word-break: break-all;">%s</a>
                                            </div>
                                        </td>
                                    </tr>
                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #fafafa; padding: 18px 30px; text-align: center; border-top: 1px solid #f0f0f0; font-size: 12px; color: #8c8c8c;">
                                            Đây là email thông báo tự động từ Hệ thống KSVH QC. Vui lòng không phản hồi thư này.<br>
                                            &copy; %d Ban Kiểm soát Vận hành. Tất cả các quyền được bảo lưu.
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(escapedTitle, escapedName, escapedTitle, escapedBody, fullUrl, fullUrl, fullUrl, java.time.Year.now().getValue());
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}

package vn.ksvh.qc.shared.excel;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/** Trả file .xlsx về trình duyệt với tên file tiếng Việt (RFC 5987) và ngày xuất. */
public final class ExcelResponses {

    public static final MediaType XLSX =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("yyyyMMdd");

    private ExcelResponses() {
    }

    /** baseName vd "Danh-muc-tieu-chi" → Danh-muc-tieu-chi_20261116.xlsx */
    public static ResponseEntity<byte[]> file(String baseName, byte[] content) {
        String filename = "%s_%s.xlsx".formatted(baseName, LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).format(DAY));
        return ResponseEntity.ok()
                .contentType(XLSX)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename, StandardCharsets.UTF_8).build().toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(content);
    }
}

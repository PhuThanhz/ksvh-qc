package vn.ksvh.qc.shared.pdf;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/** Trả file .pdf về trình duyệt với tên file tiếng Việt (RFC 5987) và ngày xuất. */
public final class PdfResponses {

    public static final MediaType PDF = MediaType.APPLICATION_PDF;
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("yyyyMMdd");

    private PdfResponses() {
    }

    /** baseName vd "Phieu-kiem-tra-PER-2611-01" → Phieu-kiem-tra-PER-2611-01_20261117.pdf */
    public static ResponseEntity<byte[]> file(String baseName, byte[] content) {
        String filename = "%s_%s.pdf".formatted(baseName, LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).format(DAY));
        return ResponseEntity.ok()
                .contentType(PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename, StandardCharsets.UTF_8).build().toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(content);
    }
}

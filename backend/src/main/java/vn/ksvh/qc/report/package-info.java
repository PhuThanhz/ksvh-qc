/**
 * Thống kê cho dashboard (tuân thủ, lỗi đang mở, rủi ro cao) và xuất báo cáo Excel (Apache POI) / PDF (OpenPDF).
 * <p>
 * Nghiệp vụ: docs/DOMAIN_SPEC.md §8 Q7, Q12.
 * Khuôn mẫu: web/ (controller) · service/ · domain/ (entity, repository) · dto/ · api/ (công khai, tuỳ chọn).
 */
@ApplicationModule(displayName = "Report")
package vn.ksvh.qc.report;

import org.springframework.modulith.ApplicationModule;

/**
 * Nhắc việc đúng người: phiếu được giao, phiếu cần xác nhận, khiếu nại cần thẩm định, sắp / quá hạn khắc phục.
 * <p>
 * Nghiệp vụ: docs/DOMAIN_SPEC.md §1, câu hỏi mở Q9 (kênh gửi).
 * Khuôn mẫu: web/ (controller) · service/ · domain/ (entity, repository) · dto/ · api/ (công khai, tuỳ chọn).
 */
@ApplicationModule(displayName = "Notification")
package vn.ksvh.qc.notification;

import org.springframework.modulith.ApplicationModule;

/**
 * Phiếu chấm: check-in GPS (server tự tính khoảng cách), kết quả từng tiêu chí Đạt / Không đạt / N/A,
 * bằng chứng, huỷ phiếu. Bất biến với Chuyên viên từ khi SUBMITTED.
 * <p>
 * Nghiệp vụ: docs/DOMAIN_SPEC.md §4 bước 2, §5.2.
 * Khuôn mẫu: web/ (controller) · service/ · domain/ (entity, repository) · dto/ · api/ (công khai, tuỳ chọn).
 */
@ApplicationModule(displayName = "Inspection")
package vn.ksvh.qc.inspection;

import org.springframework.modulith.ApplicationModule;

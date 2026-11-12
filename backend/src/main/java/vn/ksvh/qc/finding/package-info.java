/**
 * Lỗi (mỗi tiêu chí Không đạt): CHT xác nhận / khiếu nại, thẩm định N người, khắc phục, nghiệm thu,
 * job quá hạn. Mỗi lần được tính tần suất ghi một dòng finding_occurrence.
 * <p>
 * Nghiệp vụ: docs/DOMAIN_SPEC.md §4 bước 3–5, §5.3.
 * Khuôn mẫu: web/ (controller) · service/ · domain/ (entity, repository) · dto/ · api/ (công khai, tuỳ chọn).
 */
@ApplicationModule(displayName = "Finding")
package vn.ksvh.qc.finding;

import org.springframework.modulith.ApplicationModule;

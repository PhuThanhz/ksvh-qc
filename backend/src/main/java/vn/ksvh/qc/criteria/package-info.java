/**
 * Nhóm tiêu chí, tiêu chí (cách kiểm tra, bằng chứng, mức ảnh hưởng gốc), mẫu phiếu chấm,
 * phân loại rủi ro M1–M4, cấu hình tần suất, quy tắc nâng mức ảnh hưởng. Danh mục có ngày hiệu lực.
 * <p>
 * Nghiệp vụ: docs/DOMAIN_SPEC.md §3 (danh mục 5–9).
 * Khuôn mẫu: web/ (controller) · service/ · domain/ (entity, repository) · dto/ · api/ (công khai, tuỳ chọn).
 */
@ApplicationModule(displayName = "Criteria")
package vn.ksvh.qc.criteria;

import org.springframework.modulith.ApplicationModule;

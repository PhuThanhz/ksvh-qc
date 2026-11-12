/**
 * Tính tần suất theo kỳ đếm, điểm rủi ro = mức ảnh hưởng × tần suất, phân mức M1–M4, hạn khắc phục,
 * nâng / hạ mức ảnh hưởng theo nhà hàng. Logic thuần, có unit test theo các test case trong spec.
 * <p>
 * Nghiệp vụ: docs/DOMAIN_SPEC.md §6.
 * Khuôn mẫu: web/ (controller) · service/ · domain/ (entity, repository) · dto/ · api/ (công khai, tuỳ chọn).
 */
@ApplicationModule(displayName = "Risk")
package vn.ksvh.qc.risk;

import org.springframework.modulith.ApplicationModule;

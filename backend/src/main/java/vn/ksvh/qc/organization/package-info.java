/**
 * Công ty và nhà hàng / phòng ban: mã, tên, loại nhà hàng, CHT và OBM phụ trách, toạ độ, bán kính GPS.
 * <p>
 * Nghiệp vụ: docs/DOMAIN_SPEC.md §3 (danh mục 1–2).
 * Khuôn mẫu: web/ (controller) · service/ · domain/ (entity, repository) · dto/ · api/ (công khai, tuỳ chọn).
 */
@ApplicationModule(displayName = "Organization")
package vn.ksvh.qc.organization;

import org.springframework.modulith.ApplicationModule;

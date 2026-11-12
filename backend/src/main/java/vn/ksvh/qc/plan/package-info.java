/**
 * Kế hoạch kiểm tra: Trưởng nhóm lập, Quản lý KSVH duyệt hoặc từ chối có lý do; duyệt xong sinh phiếu chấm.
 * <p>
 * Nghiệp vụ: docs/DOMAIN_SPEC.md §4 bước 1, §5.1.
 * Khuôn mẫu: web/ (controller) · service/ · domain/ (entity, repository) · dto/ · api/ (công khai, tuỳ chọn).
 */
@ApplicationModule(displayName = "Plan")
package vn.ksvh.qc.plan;

import org.springframework.modulith.ApplicationModule;

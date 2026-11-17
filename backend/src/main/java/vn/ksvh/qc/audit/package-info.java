/**
 * Nhật ký hệ thống (Audit Log): ghi nhận mọi thao tác quản trị, cấu hình danh mục,
 * phân quyền, thay đổi cấu hình rủi ro, huỷ phiếu và kết luận khiếu nại.
 * <p>
 * Khuôn mẫu: web/ (controller) · service/ · domain/ (entity, repository) · dto/ · api/ (công khai).
 */
@ApplicationModule(displayName = "Audit")
package vn.ksvh.qc.audit;

import org.springframework.modulith.ApplicationModule;

/**
 * Nhân viên: hồ sơ nhân sự (mã NV, họ tên, chức danh, nhà hàng / phòng ban, liên hệ), tách khỏi tài khoản
 * đăng nhập. Một nhân viên liên kết tối đa một tài khoản (module user).
 * <p>
 * Nghiệp vụ: docs/DOMAIN_SPEC.md §3 (danh mục 4).
 * Khuôn mẫu: web/ (controller) · service/ · domain/ (entity, repository) · dto/ · api/ (công khai, tuỳ chọn).
 */
@ApplicationModule(displayName = "Employee")
package vn.ksvh.qc.employee;

import org.springframework.modulith.ApplicationModule;

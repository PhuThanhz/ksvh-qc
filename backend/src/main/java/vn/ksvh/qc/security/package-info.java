/**
 * Hạ tầng bảo mật: cấu hình Spring Security, JWT, danh mục permission, người dùng hiện tại.
 * Không phụ thuộc module nghiệp vụ nào. Module mở để mọi module dùng Permission/CurrentUser.
 */
@ApplicationModule(displayName = "Security", type = ApplicationModule.Type.OPEN)
package vn.ksvh.qc.security;

import org.springframework.modulith.ApplicationModule;

/**
 * Hạ tầng dùng chung cho mọi module: lỗi, phân trang, entity cơ sở, tiện ích.
 * KHÔNG chứa nghiệp vụ. Module mở (OPEN) để mọi module khác dùng các package con.
 */
@ApplicationModule(displayName = "Shared", type = ApplicationModule.Type.OPEN)
package vn.ksvh.qc.shared;

import org.springframework.modulith.ApplicationModule;

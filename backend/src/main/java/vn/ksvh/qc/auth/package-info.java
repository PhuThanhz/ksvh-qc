/**
 * Xác thực: đăng nhập, làm mới phiên (refresh token rotation), đăng xuất.
 * Access token: JWT 15 phút, client giữ trong bộ nhớ.
 * Refresh token: chuỗi ngẫu nhiên trong cookie HttpOnly, DB chỉ lưu SHA-256. Xem docs/AUTHENTICATION.md.
 */
@ApplicationModule(displayName = "Auth")
package vn.ksvh.qc.auth;

import org.springframework.modulith.ApplicationModule;

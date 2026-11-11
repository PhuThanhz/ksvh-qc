package vn.ksvh.qc.auth.service;

/** Thông tin thiết bị gọi đăng nhập/làm mới, lưu kèm refresh token để quản lý phiên. */
public record ClientInfo(String userAgent, String ipAddress) {

    public ClientInfo {
        userAgent = truncate(userAgent, 255);
        ipAddress = truncate(ipAddress, 45);
    }

    private static String truncate(String value, int max) {
        return value == null || value.length() <= max ? value : value.substring(0, max);
    }
}

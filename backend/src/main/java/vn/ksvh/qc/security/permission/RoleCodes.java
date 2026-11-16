package vn.ksvh.qc.security.permission;

/**
 * Mã 8 vai trò (docs/DOMAIN_SPEC.md §2), seed bằng Flyway.
 * Kiểm tra QUYỀN luôn dùng permission; mã role chỉ dùng khi nghiệp vụ yêu cầu đúng vai trò
 * (ví dụ: người được gán làm CHT của nhà hàng phải có role STORE_MANAGER).
 */
public final class RoleCodes {

    public static final String SYSTEM_ADMIN = "SYSTEM_ADMIN";
    public static final String BUSINESS_ADMIN = "BUSINESS_ADMIN";
    public static final String KSVH_LEAD = "KSVH_LEAD";
    public static final String KSVH_MANAGER = "KSVH_MANAGER";
    public static final String KSVH_INSPECTOR = "KSVH_INSPECTOR";
    public static final String STORE_MANAGER = "STORE_MANAGER";
    public static final String OBM = "OBM";
    public static final String EXECUTIVE = "EXECUTIVE";

    private RoleCodes() {
    }
}

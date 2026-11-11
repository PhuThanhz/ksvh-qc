package vn.ksvh.qc.security.permission;

/**
 * Mã permission dạng hằng số để dùng trong @PreAuthorize:
 * {@code @PreAuthorize("hasAuthority('" + PermissionCodes.USER_READ + "')")}.
 * Thêm mã mới: thêm hằng ở đây + phần tử trong {@link Permission} + gán cho role bằng migration.
 */
public final class PermissionCodes {

    public static final String USER_READ = "user:read";
    public static final String USER_MANAGE = "user:manage";
    public static final String LOCATION_READ = "location:read";
    public static final String LOCATION_MANAGE = "location:manage";
    public static final String CHECKLIST_READ = "checklist:read";
    public static final String CHECKLIST_MANAGE = "checklist:manage";
    public static final String AUDIT_READ_OWN = "audit:read:own";
    public static final String AUDIT_READ_ALL = "audit:read:all";
    public static final String AUDIT_CREATE = "audit:create";
    public static final String AUDIT_APPROVE = "audit:approve";
    public static final String REPORT_READ = "report:read";
    public static final String REPORT_EXPORT = "report:export";
    public static final String MEDIA_UPLOAD = "media:upload";

    private PermissionCodes() {
    }
}

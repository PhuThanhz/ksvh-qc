package vn.ksvh.qc.security.permission;

/**
 * Mã permission dạng hằng số để dùng trong @PreAuthorize:
 * {@code @PreAuthorize("hasAuthority('" + PermissionCodes.USER_READ + "')")}.
 * Thêm mã mới: thêm hằng ở đây + phần tử trong {@link Permission} + gán cho role bằng migration.
 * <p>
 * Dạng {@code module:action[:scope]}. Hậu tố {@code :own} nghĩa là chỉ dữ liệu liên quan tới người dùng
 * (Chuyên viên – phiếu được giao; CHT/OBM – nhà hàng phụ trách); service phải kiểm tra phạm vi.
 * Gán role → permission: docs/DOMAIN_SPEC.md §2.1.
 */
public final class PermissionCodes {

    // Người dùng, vai trò, hệ thống (Ban Giải pháp)
    public static final String USER_READ = "user:read";
    public static final String USER_MANAGE = "user:manage";
    public static final String ROLE_MANAGE = "role:manage";
    public static final String SYSTEM_CONFIG = "system:config";
    public static final String SYSTEM_LOG_READ = "system:log:read";

    // Danh mục công ty, nhà hàng
    public static final String ORGANIZATION_READ = "organization:read";
    public static final String ORGANIZATION_MANAGE = "organization:manage";

    // Danh mục tiêu chí, mẫu phiếu, cấu hình rủi ro
    public static final String CRITERIA_READ = "criteria:read";
    public static final String CRITERIA_MANAGE = "criteria:manage";

    // Kế hoạch kiểm tra
    public static final String PLAN_READ = "plan:read";
    public static final String PLAN_CREATE = "plan:create";
    public static final String PLAN_APPROVE = "plan:approve";

    // Phiếu chấm
    public static final String INSPECTION_READ_OWN = "inspection:read:own";
    public static final String INSPECTION_READ_ALL = "inspection:read:all";
    public static final String INSPECTION_PERFORM = "inspection:perform";
    public static final String INSPECTION_CANCEL = "inspection:cancel";

    // Lỗi: xác nhận / khiếu nại, thẩm định, khắc phục, nghiệm thu
    public static final String FINDING_RESPOND = "finding:respond";
    public static final String FINDING_REVIEW_APPEAL = "finding:review-appeal";
    public static final String FINDING_CONCLUDE_APPEAL = "finding:conclude-appeal";
    public static final String FINDING_REMEDIATE = "finding:remediate";
    public static final String FINDING_VERIFY = "finding:verify";

    // Báo cáo, ảnh/video
    public static final String REPORT_READ = "report:read";
    public static final String REPORT_EXPORT = "report:export";
    public static final String MEDIA_UPLOAD = "media:upload";

    private PermissionCodes() {
    }
}

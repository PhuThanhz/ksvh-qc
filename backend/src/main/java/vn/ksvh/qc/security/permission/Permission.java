package vn.ksvh.qc.security.permission;

import com.fasterxml.jackson.annotation.JsonValue;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Danh mục permission của hệ thống (nguồn sự thật là code). Gán role → permission nằm trong DB.
 * Serialize ra JSON/OpenAPI bằng code (ví dụ "plan:approve") để frontend sinh type union.
 */
@Schema(name = "Permission", enumAsRef = true)
public enum Permission {
    USER_READ(PermissionCodes.USER_READ, "Xem danh sách người dùng"),
    USER_MANAGE(PermissionCodes.USER_MANAGE, "Tạo, sửa, khoá tài khoản; gán vai trò; đặt lại mật khẩu"),
    ROLE_MANAGE(PermissionCodes.ROLE_MANAGE, "Tạo vai trò, sửa quyền của vai trò"),
    SYSTEM_CONFIG(PermissionCodes.SYSTEM_CONFIG, "Cấu hình hệ thống"),
    SYSTEM_LOG_READ(PermissionCodes.SYSTEM_LOG_READ, "Xem nhật ký hệ thống"),
    EMPLOYEE_READ(PermissionCodes.EMPLOYEE_READ, "Xem hồ sơ nhân viên"),
    EMPLOYEE_MANAGE(PermissionCodes.EMPLOYEE_MANAGE, "Tạo, sửa hồ sơ nhân viên; liên kết tài khoản"),
    ORGANIZATION_READ(PermissionCodes.ORGANIZATION_READ, "Xem công ty, nhà hàng, phòng ban"),
    ORGANIZATION_MANAGE(PermissionCodes.ORGANIZATION_MANAGE, "Khai báo công ty, nhà hàng, phòng ban"),
    CRITERIA_READ(PermissionCodes.CRITERIA_READ, "Xem tiêu chí, mẫu phiếu, cấu hình rủi ro"),
    CRITERIA_MANAGE(PermissionCodes.CRITERIA_MANAGE, "Sửa tiêu chí, mẫu phiếu, mức rủi ro, tần suất, quy tắc nâng mức"),
    PLAN_READ(PermissionCodes.PLAN_READ, "Xem kế hoạch kiểm tra"),
    PLAN_CREATE(PermissionCodes.PLAN_CREATE, "Lập, sửa, gửi duyệt kế hoạch kiểm tra"),
    PLAN_APPROVE(PermissionCodes.PLAN_APPROVE, "Duyệt / từ chối kế hoạch kiểm tra"),
    INSPECTION_READ_OWN(PermissionCodes.INSPECTION_READ_OWN, "Xem phiếu chấm liên quan tới mình (được giao / nhà hàng phụ trách)"),
    INSPECTION_READ_ALL(PermissionCodes.INSPECTION_READ_ALL, "Xem mọi phiếu chấm"),
    INSPECTION_PERFORM(PermissionCodes.INSPECTION_PERFORM, "Check-in GPS, chấm phiếu được giao"),
    INSPECTION_CANCEL(PermissionCodes.INSPECTION_CANCEL, "Huỷ phiếu chấm"),
    FINDING_RESPOND(PermissionCodes.FINDING_RESPOND, "Xác nhận / khiếu nại lỗi"),
    FINDING_REVIEW_APPEAL(PermissionCodes.FINDING_REVIEW_APPEAL, "Thẩm định khiếu nại được chọn"),
    FINDING_CONCLUDE_APPEAL(PermissionCodes.FINDING_CONCLUDE_APPEAL, "Chốt kết luận khiếu nại sau họp"),
    FINDING_REMEDIATE(PermissionCodes.FINDING_REMEDIATE, "Lập kế hoạch khắc phục, gửi bằng chứng"),
    FINDING_VERIFY(PermissionCodes.FINDING_VERIFY, "Nghiệm thu khắc phục"),
    REPORT_READ(PermissionCodes.REPORT_READ, "Xem dashboard, báo cáo"),
    REPORT_EXPORT(PermissionCodes.REPORT_EXPORT, "Xuất báo cáo Excel / PDF"),
    MEDIA_UPLOAD(PermissionCodes.MEDIA_UPLOAD, "Tải ảnh / video bằng chứng");

    private static final Map<String, Permission> BY_CODE = Arrays.stream(values())
            .collect(Collectors.toUnmodifiableMap(Permission::code, Function.identity()));

    private final String code;
    private final String description;

    Permission(String code, String description) {
        this.code = code;
        this.description = description;
    }

    @JsonValue
    public String code() {
        return code;
    }

    /** Mô tả tiếng Việt, hiển thị ở màn hình quản trị quyền. */
    public String description() {
        return description;
    }

    /** Module = phần trước dấu ":" đầu tiên (vd "finding" của "finding:verify"). */
    public String module() {
        return code.substring(0, code.indexOf(':'));
    }

    public static Optional<Permission> fromCode(String code) {
        return Optional.ofNullable(BY_CODE.get(code));
    }
}

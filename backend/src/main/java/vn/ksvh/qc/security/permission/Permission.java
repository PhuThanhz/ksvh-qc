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
    USER_READ(PermissionCodes.USER_READ),
    USER_MANAGE(PermissionCodes.USER_MANAGE),
    ROLE_MANAGE(PermissionCodes.ROLE_MANAGE),
    SYSTEM_CONFIG(PermissionCodes.SYSTEM_CONFIG),
    SYSTEM_LOG_READ(PermissionCodes.SYSTEM_LOG_READ),
    ORGANIZATION_READ(PermissionCodes.ORGANIZATION_READ),
    ORGANIZATION_MANAGE(PermissionCodes.ORGANIZATION_MANAGE),
    CRITERIA_READ(PermissionCodes.CRITERIA_READ),
    CRITERIA_MANAGE(PermissionCodes.CRITERIA_MANAGE),
    PLAN_READ(PermissionCodes.PLAN_READ),
    PLAN_CREATE(PermissionCodes.PLAN_CREATE),
    PLAN_APPROVE(PermissionCodes.PLAN_APPROVE),
    INSPECTION_READ_OWN(PermissionCodes.INSPECTION_READ_OWN),
    INSPECTION_READ_ALL(PermissionCodes.INSPECTION_READ_ALL),
    INSPECTION_PERFORM(PermissionCodes.INSPECTION_PERFORM),
    INSPECTION_CANCEL(PermissionCodes.INSPECTION_CANCEL),
    FINDING_RESPOND(PermissionCodes.FINDING_RESPOND),
    FINDING_REVIEW_APPEAL(PermissionCodes.FINDING_REVIEW_APPEAL),
    FINDING_CONCLUDE_APPEAL(PermissionCodes.FINDING_CONCLUDE_APPEAL),
    FINDING_REMEDIATE(PermissionCodes.FINDING_REMEDIATE),
    FINDING_VERIFY(PermissionCodes.FINDING_VERIFY),
    REPORT_READ(PermissionCodes.REPORT_READ),
    REPORT_EXPORT(PermissionCodes.REPORT_EXPORT),
    MEDIA_UPLOAD(PermissionCodes.MEDIA_UPLOAD);

    private static final Map<String, Permission> BY_CODE = Arrays.stream(values())
            .collect(Collectors.toUnmodifiableMap(Permission::code, Function.identity()));

    private final String code;

    Permission(String code) {
        this.code = code;
    }

    @JsonValue
    public String code() {
        return code;
    }

    public static Optional<Permission> fromCode(String code) {
        return Optional.ofNullable(BY_CODE.get(code));
    }
}

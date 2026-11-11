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
 * Serialize ra JSON/OpenAPI bằng code (ví dụ "audit:approve") để frontend sinh type union.
 */
@Schema(name = "Permission", enumAsRef = true)
public enum Permission {
    USER_READ(PermissionCodes.USER_READ),
    USER_MANAGE(PermissionCodes.USER_MANAGE),
    LOCATION_READ(PermissionCodes.LOCATION_READ),
    LOCATION_MANAGE(PermissionCodes.LOCATION_MANAGE),
    CHECKLIST_READ(PermissionCodes.CHECKLIST_READ),
    CHECKLIST_MANAGE(PermissionCodes.CHECKLIST_MANAGE),
    AUDIT_READ_OWN(PermissionCodes.AUDIT_READ_OWN),
    AUDIT_READ_ALL(PermissionCodes.AUDIT_READ_ALL),
    AUDIT_CREATE(PermissionCodes.AUDIT_CREATE),
    AUDIT_APPROVE(PermissionCodes.AUDIT_APPROVE),
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

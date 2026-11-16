package vn.ksvh.qc.user.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.web.ApiPaths;
import vn.ksvh.qc.user.dto.PermissionResponse;
import vn.ksvh.qc.user.dto.RoleRequest;
import vn.ksvh.qc.user.dto.RoleResponse;
import vn.ksvh.qc.user.service.RoleService;

import java.util.List;

/** Vai trò và danh mục permission. Người quản lý người dùng cần xem vai trò để gán. */
@RestController
@RequestMapping(ApiPaths.V1)
@RequiredArgsConstructor
public class RoleController {

    private static final String CAN_VIEW =
            "hasAnyAuthority('" + PermissionCodes.USER_READ + "', '" + PermissionCodes.ROLE_MANAGE + "')";
    private static final String CAN_MANAGE = "hasAuthority('" + PermissionCodes.ROLE_MANAGE + "')";

    private final RoleService roleService;

    @GetMapping("/permissions")
    @PreAuthorize(CAN_VIEW)
    public List<PermissionResponse> permissions() {
        return roleService.permissions();
    }

    @GetMapping("/roles")
    @PreAuthorize(CAN_VIEW)
    public List<RoleResponse> list() {
        return roleService.list();
    }

    @GetMapping("/roles/{id}")
    @PreAuthorize(CAN_VIEW)
    public RoleResponse get(@PathVariable Long id) {
        return roleService.get(id);
    }

    @PostMapping("/roles")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(CAN_MANAGE)
    public RoleResponse create(@Valid @RequestBody RoleRequest request, @AuthenticationPrincipal Jwt jwt) {
        return roleService.create(request, CurrentUser.from(jwt).id());
    }

    @PutMapping("/roles/{id}")
    @PreAuthorize(CAN_MANAGE)
    public RoleResponse update(@PathVariable Long id, @Valid @RequestBody RoleRequest request,
                               @AuthenticationPrincipal Jwt jwt) {
        return roleService.update(id, request, CurrentUser.from(jwt).id());
    }

    @DeleteMapping("/roles/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize(CAN_MANAGE)
    public void delete(@PathVariable Long id) {
        roleService.delete(id);
    }
}

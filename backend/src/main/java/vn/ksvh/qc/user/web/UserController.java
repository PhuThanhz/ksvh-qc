package vn.ksvh.qc.user.web;

import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.web.ApiPaths;
import vn.ksvh.qc.shared.web.PageResponse;
import vn.ksvh.qc.user.dto.PasswordResetRequest;
import vn.ksvh.qc.user.dto.UserCreateRequest;
import vn.ksvh.qc.user.dto.UserResponse;
import vn.ksvh.qc.user.dto.UserUpdateRequest;
import vn.ksvh.qc.user.service.UserService;

@RestController
@RequestMapping(ApiPaths.V1 + "/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority('" + PermissionCodes.USER_READ + "')")
    public PageResponse<UserResponse> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active,
            @ParameterObject @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return userService.search(keyword, role, active, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('" + PermissionCodes.USER_READ + "')")
    public UserResponse get(@PathVariable Long id) {
        return userService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('" + PermissionCodes.USER_MANAGE + "')")
    public UserResponse create(@Valid @RequestBody UserCreateRequest request, @AuthenticationPrincipal Jwt jwt) {
        return userService.create(request, CurrentUser.from(jwt).id());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('" + PermissionCodes.USER_MANAGE + "')")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request,
                               @AuthenticationPrincipal Jwt jwt) {
        return userService.update(id, request, CurrentUser.from(jwt).id());
    }

    @PostMapping("/{id}/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('" + PermissionCodes.USER_MANAGE + "')")
    public void resetPassword(@PathVariable Long id, @Valid @RequestBody PasswordResetRequest request,
                              @AuthenticationPrincipal Jwt jwt) {
        userService.resetPassword(id, request, CurrentUser.from(jwt).id());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('" + PermissionCodes.USER_MANAGE + "')")
    public void delete(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        userService.delete(id, CurrentUser.from(jwt).id());
    }
}

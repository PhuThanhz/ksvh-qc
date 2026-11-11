package vn.ksvh.qc.user.web;

import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.web.ApiPaths;
import vn.ksvh.qc.shared.web.PageResponse;
import vn.ksvh.qc.user.dto.UserResponse;
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
            @ParameterObject @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return userService.search(keyword, pageable);
    }
}

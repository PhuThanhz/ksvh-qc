package vn.ksvh.qc.organization.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.ksvh.qc.organization.dto.RestaurantAssignmentRequest;
import vn.ksvh.qc.organization.dto.RestaurantAssignmentResponse;
import vn.ksvh.qc.organization.service.RestaurantAssignmentService;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.web.ApiPaths;

/** Nhà hàng phụ trách của một người dùng (Cửa hàng trưởng / OBM), thao tác từ màn Người dùng. */
@RestController
@RequestMapping(ApiPaths.V1 + "/org-units/assignments")
@RequiredArgsConstructor
public class RestaurantAssignmentController {

    private final RestaurantAssignmentService service;

    @GetMapping("/{userId}")
    @PreAuthorize("hasAuthority('" + PermissionCodes.ORGANIZATION_READ + "')")
    public RestaurantAssignmentResponse get(@PathVariable Long userId) {
        return service.get(userId);
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasAuthority('" + PermissionCodes.ORGANIZATION_MANAGE + "')")
    public RestaurantAssignmentResponse replace(@PathVariable Long userId,
                                                @Valid @RequestBody RestaurantAssignmentRequest request) {
        return service.replace(userId, request);
    }
}

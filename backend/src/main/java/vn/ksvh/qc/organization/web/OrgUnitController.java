package vn.ksvh.qc.organization.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.ksvh.qc.organization.domain.OrgUnitType;
import vn.ksvh.qc.organization.dto.OrgUnitRequest;
import vn.ksvh.qc.organization.dto.OrgUnitResponse;
import vn.ksvh.qc.organization.service.OrgUnitService;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.web.ApiPaths;
import vn.ksvh.qc.shared.web.PageResponse;

/** Nhà hàng / phòng ban. */
@RestController
@RequestMapping(ApiPaths.V1 + "/org-units")
@RequiredArgsConstructor
public class OrgUnitController {

    private final OrgUnitService orgUnitService;

    @GetMapping
    @PreAuthorize("hasAuthority('" + PermissionCodes.ORGANIZATION_READ + "')")
    public PageResponse<OrgUnitResponse> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) OrgUnitType unitType,
            @RequestParam(required = false) Boolean active,
            @ParameterObject @PageableDefault(size = 20, sort = "code", direction = Sort.Direction.ASC)
            Pageable pageable) {
        return orgUnitService.search(keyword, companyId, unitType, active, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('" + PermissionCodes.ORGANIZATION_READ + "')")
    public OrgUnitResponse get(@PathVariable Long id) {
        return orgUnitService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('" + PermissionCodes.ORGANIZATION_MANAGE + "')")
    public OrgUnitResponse create(@Valid @RequestBody OrgUnitRequest request) {
        return orgUnitService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('" + PermissionCodes.ORGANIZATION_MANAGE + "')")
    public OrgUnitResponse update(@PathVariable Long id, @Valid @RequestBody OrgUnitRequest request) {
        return orgUnitService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('" + PermissionCodes.ORGANIZATION_MANAGE + "')")
    public void delete(@PathVariable Long id) {
        orgUnitService.delete(id);
    }
}

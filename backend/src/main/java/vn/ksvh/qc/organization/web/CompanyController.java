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
import vn.ksvh.qc.organization.dto.CompanyRequest;
import vn.ksvh.qc.organization.dto.CompanyResponse;
import vn.ksvh.qc.organization.service.CompanyService;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.web.ApiPaths;
import vn.ksvh.qc.shared.web.PageResponse;

@RestController
@RequestMapping(ApiPaths.V1 + "/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    @PreAuthorize("hasAuthority('" + PermissionCodes.ORGANIZATION_READ + "')")
    public PageResponse<CompanyResponse> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean active,
            @ParameterObject @PageableDefault(size = 20, sort = "code", direction = Sort.Direction.ASC)
            Pageable pageable) {
        return companyService.search(keyword, active, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('" + PermissionCodes.ORGANIZATION_READ + "')")
    public CompanyResponse get(@PathVariable Long id) {
        return companyService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('" + PermissionCodes.ORGANIZATION_MANAGE + "')")
    public CompanyResponse create(@Valid @RequestBody CompanyRequest request) {
        return companyService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('" + PermissionCodes.ORGANIZATION_MANAGE + "')")
    public CompanyResponse update(@PathVariable Long id, @Valid @RequestBody CompanyRequest request) {
        return companyService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('" + PermissionCodes.ORGANIZATION_MANAGE + "')")
    public void delete(@PathVariable Long id) {
        companyService.delete(id);
    }
}

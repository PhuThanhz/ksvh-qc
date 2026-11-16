package vn.ksvh.qc.employee.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import vn.ksvh.qc.employee.dto.EmployeeRequest;
import vn.ksvh.qc.employee.dto.EmployeeResponse;
import vn.ksvh.qc.employee.service.EmployeeService;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.web.ApiPaths;
import vn.ksvh.qc.shared.web.PageResponse;

@RestController
@RequestMapping(ApiPaths.V1 + "/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    @PreAuthorize("hasAuthority('" + PermissionCodes.EMPLOYEE_READ + "')")
    public PageResponse<EmployeeResponse> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long orgUnitId,
            @RequestParam(required = false) Boolean active,
            @ParameterObject @PageableDefault(size = 20, sort = "employeeCode", direction = Sort.Direction.ASC)
            Pageable pageable) {
        return employeeService.search(keyword, orgUnitId, active, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('" + PermissionCodes.EMPLOYEE_READ + "')")
    public EmployeeResponse get(@PathVariable Long id) {
        return employeeService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('" + PermissionCodes.EMPLOYEE_MANAGE + "')")
    public EmployeeResponse create(@Valid @RequestBody EmployeeRequest request, @AuthenticationPrincipal Jwt jwt) {
        return employeeService.create(request, CurrentUser.from(jwt).id());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('" + PermissionCodes.EMPLOYEE_MANAGE + "')")
    public EmployeeResponse update(@PathVariable Long id, @Valid @RequestBody EmployeeRequest request,
                                   @AuthenticationPrincipal Jwt jwt) {
        return employeeService.update(id, request, CurrentUser.from(jwt).id());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('" + PermissionCodes.EMPLOYEE_MANAGE + "')")
    public void delete(@PathVariable Long id) {
        employeeService.delete(id);
    }
}

package vn.ksvh.qc.criteria.web;

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
import vn.ksvh.qc.criteria.dto.CriterionGroupRequest;
import vn.ksvh.qc.criteria.dto.CriterionGroupResponse;
import vn.ksvh.qc.criteria.dto.CriterionRequest;
import vn.ksvh.qc.criteria.dto.CriterionResponse;
import vn.ksvh.qc.criteria.service.CriterionService;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.web.ApiPaths;
import vn.ksvh.qc.shared.web.PageResponse;

import java.util.List;

/** Danh mục 5: nhóm tiêu chí và tiêu chí. */
@RestController
@RequestMapping(ApiPaths.V1)
@RequiredArgsConstructor
public class CriterionController {

    static final String CAN_READ = "hasAuthority('" + PermissionCodes.CRITERIA_READ + "')";
    static final String CAN_MANAGE = "hasAuthority('" + PermissionCodes.CRITERIA_MANAGE + "')";

    private final CriterionService service;

    @GetMapping("/criterion-groups")
    @PreAuthorize(CAN_READ)
    public List<CriterionGroupResponse> groups(@RequestParam(required = false) Long companyId) {
        return service.listGroups(companyId);
    }

    @PostMapping("/criterion-groups")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(CAN_MANAGE)
    public CriterionGroupResponse createGroup(@Valid @RequestBody CriterionGroupRequest req, @AuthenticationPrincipal Jwt jwt) {
        return service.createGroup(req, CurrentUser.from(jwt).id());
    }

    @PutMapping("/criterion-groups/{id}")
    @PreAuthorize(CAN_MANAGE)
    public CriterionGroupResponse updateGroup(@PathVariable Long id, @Valid @RequestBody CriterionGroupRequest req,
                                              @AuthenticationPrincipal Jwt jwt) {
        return service.updateGroup(id, req, CurrentUser.from(jwt).id());
    }

    @GetMapping("/criteria")
    @PreAuthorize(CAN_READ)
    public PageResponse<CriterionResponse> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) Long templateId,
            @RequestParam(required = false) Boolean assignedToTemplate,
            @RequestParam(required = false) Boolean active,
            @ParameterObject @PageableDefault(size = 20, sort = "sortOrder", direction = Sort.Direction.ASC)
            Pageable pageable) {
        return service.search(keyword, groupId, templateId, assignedToTemplate, active, pageable);
    }

    /** Tiêu chí đang hoạt động, đã sắp xếp theo nhóm – để chọn vào mẫu phiếu. */
    @GetMapping("/criteria/options")
    @PreAuthorize(CAN_READ)
    public List<CriterionResponse> options() {
        return service.activeOptions();
    }

    @GetMapping("/criteria/{id}")
    @PreAuthorize(CAN_READ)
    public CriterionResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping("/criteria")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(CAN_MANAGE)
    public CriterionResponse create(@Valid @RequestBody CriterionRequest req, @AuthenticationPrincipal Jwt jwt) {
        return service.create(req, CurrentUser.from(jwt).id());
    }

    @PostMapping("/criteria/batch")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(CAN_MANAGE)
    public List<CriterionResponse> createBatch(@Valid @RequestBody List<CriterionRequest> reqs, @AuthenticationPrincipal Jwt jwt) {
        return service.createBatch(reqs, CurrentUser.from(jwt).id());
    }

    @PutMapping("/criteria/{id}")
    @PreAuthorize(CAN_MANAGE)
    public CriterionResponse update(@PathVariable Long id, @Valid @RequestBody CriterionRequest req,
                                    @AuthenticationPrincipal Jwt jwt) {
        return service.update(id, req, CurrentUser.from(jwt).id());
    }

    @DeleteMapping("/criteria/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize(CAN_MANAGE)
    public void deleteCriterion(@PathVariable Long id) {
        service.deleteCriterion(id);
    }
}

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
import vn.ksvh.qc.criteria.dto.TemplateOption;
import vn.ksvh.qc.criteria.dto.TemplateRequest;
import vn.ksvh.qc.criteria.dto.TemplateResponse;
import vn.ksvh.qc.criteria.service.TemplateService;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.shared.web.ApiPaths;
import vn.ksvh.qc.shared.web.PageResponse;

import java.util.List;

/** Danh mục 6: mẫu phiếu chấm. */
@RestController
@RequestMapping(ApiPaths.V1 + "/inspection-templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService service;

    @GetMapping
    @PreAuthorize(CriterionController.CAN_READ)
    public PageResponse<TemplateResponse> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) Boolean active,
            @ParameterObject @PageableDefault(size = 20, sort = "code", direction = Sort.Direction.ASC) Pageable pageable) {
        return service.search(keyword, companyId, active, pageable);
    }

    @GetMapping("/options")
    @PreAuthorize(CriterionController.CAN_READ)
    public List<TemplateOption> options() {
        return service.options();
    }

    @GetMapping("/{id}")
    @PreAuthorize(CriterionController.CAN_READ)
    public TemplateResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(CriterionController.CAN_MANAGE)
    public TemplateResponse create(@Valid @RequestBody TemplateRequest req, @AuthenticationPrincipal Jwt jwt) {
        return service.create(req, CurrentUser.from(jwt).id());
    }

    @PutMapping("/{id}")
    @PreAuthorize(CriterionController.CAN_MANAGE)
    public TemplateResponse update(@PathVariable Long id, @Valid @RequestBody TemplateRequest req,
                                   @AuthenticationPrincipal Jwt jwt) {
        return service.update(id, req, CurrentUser.from(jwt).id());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize(CriterionController.CAN_MANAGE)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}

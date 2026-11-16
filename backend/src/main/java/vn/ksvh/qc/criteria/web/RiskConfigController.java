package vn.ksvh.qc.criteria.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import vn.ksvh.qc.criteria.dto.EscalationRuleRequest;
import vn.ksvh.qc.criteria.dto.EscalationRuleResponse;
import vn.ksvh.qc.criteria.dto.FrequencyConfigRequest;
import vn.ksvh.qc.criteria.dto.FrequencyConfigResponse;
import vn.ksvh.qc.criteria.dto.RiskLevelItem;
import vn.ksvh.qc.criteria.dto.RiskLevelVersionRequest;
import vn.ksvh.qc.criteria.dto.RiskLevelVersionResponse;
import vn.ksvh.qc.criteria.service.RiskConfigService;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.shared.web.ApiPaths;

import java.time.LocalDate;
import java.util.List;

/** Danh mục 7–9: phân loại rủi ro, cấu hình tần suất, quy tắc nâng mức ảnh hưởng. */
@RestController
@RequestMapping(ApiPaths.V1)
@RequiredArgsConstructor
@Validated
public class RiskConfigController {

    private final RiskConfigService service;

    @GetMapping("/risk-levels")
    @PreAuthorize(CriterionController.CAN_READ)
    public List<RiskLevelItem> riskLevels() {
        return service.riskLevels();
    }

    @GetMapping("/risk-levels/versions")
    @PreAuthorize(CriterionController.CAN_READ)
    public List<RiskLevelVersionResponse> riskLevelVersions() {
        return service.riskLevelVersions();
    }

    /** Lưu bảng mức rủi ro thành phiên bản áp dụng từ ngày hiệu lực (server kiểm tra khoảng điểm liền nhau). */
    @PutMapping("/risk-levels")
    @PreAuthorize(CriterionController.CAN_MANAGE)
    public RiskLevelVersionResponse saveRiskLevelVersion(@RequestBody @Valid RiskLevelVersionRequest req,
                                                         @AuthenticationPrincipal Jwt jwt) {
        return service.saveRiskLevelVersion(req, CurrentUser.from(jwt).id());
    }

    @DeleteMapping("/risk-levels/versions/{effectiveFrom}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize(CriterionController.CAN_MANAGE)
    public void deleteRiskLevelVersion(@PathVariable LocalDate effectiveFrom) {
        service.deleteRiskLevelVersion(effectiveFrom);
    }

    @GetMapping("/frequency-configs")
    @PreAuthorize(CriterionController.CAN_READ)
    public List<FrequencyConfigResponse> frequencyConfigs() {
        return service.frequencyConfigs();
    }

    @PostMapping("/frequency-configs")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(CriterionController.CAN_MANAGE)
    public FrequencyConfigResponse createFrequency(@Valid @RequestBody FrequencyConfigRequest req,
                                                   @AuthenticationPrincipal Jwt jwt) {
        return service.createFrequency(req, CurrentUser.from(jwt).id());
    }

    @DeleteMapping("/frequency-configs/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize(CriterionController.CAN_MANAGE)
    public void deleteFrequency(@PathVariable Long id) {
        service.deleteFrequency(id);
    }

    @GetMapping("/escalation-rules")
    @PreAuthorize(CriterionController.CAN_READ)
    public List<EscalationRuleResponse> escalationRules() {
        return service.escalationRules();
    }

    @PostMapping("/escalation-rules")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(CriterionController.CAN_MANAGE)
    public EscalationRuleResponse createEscalation(@Valid @RequestBody EscalationRuleRequest req,
                                                   @AuthenticationPrincipal Jwt jwt) {
        return service.createEscalation(req, CurrentUser.from(jwt).id());
    }

    @DeleteMapping("/escalation-rules/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize(CriterionController.CAN_MANAGE)
    public void deleteEscalation(@PathVariable Long id) {
        service.deleteEscalation(id);
    }
}

package vn.ksvh.qc.risk.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.ksvh.qc.criteria.api.CriteriaLookupApi;
import vn.ksvh.qc.criteria.api.RiskConfigRef;
import vn.ksvh.qc.risk.RiskAssessment;
import vn.ksvh.qc.risk.RiskRules;
import vn.ksvh.qc.risk.dto.RiskPreviewResponse;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.util.BusinessDates;
import vn.ksvh.qc.shared.web.ApiPaths;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

/**
 * Mô phỏng điểm rủi ro bằng đúng bộ tính dùng khi chấm (giao diện không tự tính lại).
 * violations = số lần lỗi trong kỳ, kể cả lần đang tính; giả sử các lần đều trong kỳ đếm.
 */
@RestController
@RequestMapping(ApiPaths.V1 + "/risk")
@RequiredArgsConstructor
@Validated
public class RiskPreviewController {

    private final CriteriaLookupApi criteria;
    private final Clock clock;

    @GetMapping("/preview")
    @PreAuthorize("hasAuthority('" + PermissionCodes.CRITERIA_READ + "')")
    public RiskPreviewResponse preview(
            @RequestParam @Min(value = 1, message = "Mức ảnh hưởng từ 1 đến 5") @Max(value = 5, message = "Mức ảnh hưởng từ 1 đến 5") int baseImpact,
            @RequestParam @Min(value = 1, message = "Số lần vi phạm tối thiểu 1") @Max(value = 50, message = "Số lần vi phạm tối đa 50") int violations,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate at = date != null ? date : BusinessDates.today(clock);
        RiskConfigRef config = criteria.riskConfigAt(at);
        RiskRules rules = RiskRules.from(config);
        List<LocalDate> previous = Collections.nCopies(violations - 1, at); // cùng ngày → chắc chắn nằm trong kỳ
        RiskAssessment r = rules.assess(baseImpact, previous, at);
        RiskConfigRef.Escalation e = config.escalation();
        return new RiskPreviewResponse(at, config.periodMonths(), r.periodStart(),
                e == null ? null : e.thresholdCount(), e == null ? null : e.stepIncrease(),
                e == null ? null : e.maxImpact(), e == null ? null : e.resetPeriodMonths(),
                r.baseImpact(), r.frequency(), r.effectiveImpact(), r.escalated(), r.score(),
                r.band() == null ? null : r.band().code(), r.band() == null ? null : r.band().name(),
                r.band() == null ? null : r.band().remediationDays());
    }
}

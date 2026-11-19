package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import vn.ksvh.qc.criteria.api.CriteriaLookupApi;
import vn.ksvh.qc.criteria.api.RiskConfigRef;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.inspection.domain.FindingOccurrenceRepository;
import vn.ksvh.qc.risk.RiskAssessment;
import vn.ksvh.qc.risk.RiskRules;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.util.BusinessDates;

import java.time.LocalDate;
import java.util.List;

/**
 * Tính rủi ro cho một lần lỗi mới của (nhà hàng, tiêu chí): lịch sử lấy từ bảng finding_occurrences,
 * cấu hình (kỳ đếm, nâng mức, bảng mức) lấy bản đang hiệu lực tại ngày tính.
 * Đây là nơi DUY NHẤT áp ngưỡng nâng / hạ mức riêng của nhà hàng – mọi chỗ tính rủi ro đều đi qua đây.
 */
@Component
@RequiredArgsConstructor
public class RiskAssessor {

    private final FindingOccurrenceRepository occurrences;
    private final CriteriaLookupApi criteria;
    private final OrgUnitLookupApi orgUnits;

    /** Bộ quy tắc rủi ro áp dụng cho nhà hàng tại ngày {@code at} (quy tắc chung + ngưỡng riêng nếu có). */
    public RiskRules rulesFor(Long restaurantId, LocalDate at) {
        OrgUnitRef rest = orgUnits.findRefs(List.of(restaurantId)).get(restaurantId);
        return rulesFor(rest, criteria.riskConfigAt(at));
    }

    /** Như trên khi đã có sẵn nhà hàng và cấu hình chung (tránh tra lại khi duyệt nhiều nhà hàng). */
    public static RiskRules rulesFor(OrgUnitRef restaurant, RiskConfigRef config) {
        RiskRules rules = RiskRules.from(config);
        return restaurant == null ? rules
                : rules.withEscalationOverride(restaurant.escalationThreshold(), restaurant.escalationResetMonths());
    }

    /** Lần lỗi đang tính chưa có trong bảng occurrence (gọi trước khi ghi lần +1). */
    public RiskAssessment assessNew(Long restaurantId, Long criterionId, int baseImpact, LocalDate at) {
        return assessNew(restaurantId, criterionId, baseImpact, at, rulesFor(restaurantId, at));
    }

    /** Như trên khi đã có sẵn bộ quy tắc của nhà hàng (lấy bằng {@link #rulesFor}). */
    public RiskAssessment assessNew(Long restaurantId, Long criterionId, int baseImpact, LocalDate at, RiskRules rules) {
        List<LocalDate> previous = occurrences.findOccurredAt(restaurantId, criterionId).stream()
                .map(i -> i.atZone(BusinessDates.ZONE).toLocalDate())
                .toList();
        return assess(baseImpact, previous, at, rules);
    }

    /** Tính rủi ro khi đã nạp trước danh sách lần lỗi và cấu hình rules để tối ưu batch. */
    public RiskAssessment assess(int baseImpact, List<LocalDate> previousOccurrences, LocalDate at, RiskRules rules) {
        RiskAssessment r = rules.assess(baseImpact, previousOccurrences != null ? previousOccurrences : List.of(), at);
        if (r.band() == null) {
            throw new BusinessException(ErrorCode.RISK_LEVEL_NOT_CONFIGURED,
                    "Chưa cấu hình mức rủi ro cho điểm %d, vui lòng báo Quản trị nghiệp vụ".formatted(r.score()));
        }
        return r;
    }
}

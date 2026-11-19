package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import vn.ksvh.qc.criteria.api.CriteriaLookupApi;
import vn.ksvh.qc.criteria.api.RiskConfigRef;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.organization.api.RiskPolicy;
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
 * Đây là nơi DUY NHẤT chọn bộ quy tắc theo chính sách rủi ro của nhà hàng – mọi chỗ tính rủi ro đều đi qua đây.
 */
@Component
@RequiredArgsConstructor
public class RiskAssessor {

    private final FindingOccurrenceRepository occurrences;
    private final CriteriaLookupApi criteria;
    private final OrgUnitLookupApi orgUnits;

    /** Cấu hình rủi ro áp dụng cho nhà hàng tại ngày {@code at} (theo chính sách rủi ro của nhà hàng). */
    public RiskConfigRef configFor(Long restaurantId, LocalDate at) {
        return criteria.riskConfigAt(at, policyOf(restaurantId));
    }

    /** Bộ quy tắc rủi ro áp dụng cho nhà hàng tại ngày {@code at}. */
    public RiskRules rulesFor(Long restaurantId, LocalDate at) {
        return RiskRules.from(configFor(restaurantId, at));
    }

    /** Chính sách rủi ro của nhà hàng; không tìm thấy thì coi là Tiêu chuẩn. */
    public RiskPolicy policyOf(Long restaurantId) {
        OrgUnitRef rest = orgUnits.findRefs(List.of(restaurantId)).get(restaurantId);
        return rest != null && rest.riskPolicy() != null ? rest.riskPolicy() : RiskPolicy.STANDARD;
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

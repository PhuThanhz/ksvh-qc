package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import vn.ksvh.qc.criteria.api.CriteriaLookupApi;
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
 */
@Component
@RequiredArgsConstructor
class RiskAssessor {

    private final FindingOccurrenceRepository occurrences;
    private final CriteriaLookupApi criteria;

    /** Lần lỗi đang tính chưa có trong bảng occurrence (gọi trước khi ghi lần +1). */
    RiskAssessment assessNew(Long restaurantId, Long criterionId, int baseImpact, LocalDate at) {
        RiskRules rules = RiskRules.from(criteria.riskConfigAt(at));
        List<LocalDate> previous = occurrences.findOccurredAt(restaurantId, criterionId).stream()
                .map(i -> i.atZone(BusinessDates.ZONE).toLocalDate())
                .toList();
        return assess(baseImpact, previous, at, rules);
    }

    /** Tính rủi ro khi đã nạp trước danh sách lần lỗi và cấu hình rules để tối ưu batch. */
    RiskAssessment assess(int baseImpact, List<LocalDate> previousOccurrences, LocalDate at, RiskRules rules) {
        RiskAssessment r = rules.assess(baseImpact, previousOccurrences != null ? previousOccurrences : List.of(), at);
        if (r.band() == null) {
            throw new BusinessException(ErrorCode.RISK_LEVEL_NOT_CONFIGURED,
                    "Chưa cấu hình mức rủi ro cho điểm %d, vui lòng báo Quản trị nghiệp vụ".formatted(r.score()));
        }
        return r;
    }
}

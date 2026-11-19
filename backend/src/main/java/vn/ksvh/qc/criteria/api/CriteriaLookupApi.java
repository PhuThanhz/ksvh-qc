package vn.ksvh.qc.criteria.api;

import vn.ksvh.qc.organization.api.RiskPolicy;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface CriteriaLookupApi {

    Map<Long, CriterionRef> findCriteria(Collection<Long> ids);

    Map<Long, TemplateRef> findTemplates(Collection<Long> ids);

    Optional<TemplateRef> findTemplate(Long id);

    List<RiskLevelRef> listRiskLevels();

    /**
     * Kỳ đếm, quy tắc nâng mức của chính sách {@code policy} và bảng mức rủi ro đang hiệu lực tại ngày {@code date}.
     * Chính sách chưa có phiên bản nào hiệu lực thì dùng quy tắc của chính sách Tiêu chuẩn.
     */
    RiskConfigRef riskConfigAt(java.time.LocalDate date, RiskPolicy policy);

    /** Như trên với chính sách Tiêu chuẩn. */
    default RiskConfigRef riskConfigAt(java.time.LocalDate date) {
        return riskConfigAt(date, RiskPolicy.STANDARD);
    }

    /** Nhóm tiêu chí theo id (id không tồn tại thì không có trong kết quả). */
    java.util.Map<Long, CriterionGroupRef> findGroups(Collection<Long> ids);

    /** Tiêu chí đang hoạt động thuộc các nhóm (nhóm cũng đang hoạt động), theo thứ tự nhóm rồi tiêu chí. */
    List<CriterionRef> findActiveCriteriaInGroups(Collection<Long> groupIds);
}

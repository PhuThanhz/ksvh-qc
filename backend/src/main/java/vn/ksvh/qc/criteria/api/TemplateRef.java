package vn.ksvh.qc.criteria.api;

import java.util.List;

public record TemplateRef(
        Long id,
        String code,
        String name,
        boolean active,
        Long companyId,
        Integer frequencyPeriodMonths,
        Integer escalationThresholdCount,
        Integer resetPeriodMonths,
        /** Chỉ tiêu chí đang hoạt động (cả nhóm), đúng thứ tự trong mẫu. */
        List<CriterionRef> items
) {
    public TemplateRef(Long id, String code, String name, boolean active, Long companyId, List<CriterionRef> items) {
        this(id, code, name, active, companyId, 6, 3, 6, items);
    }
}

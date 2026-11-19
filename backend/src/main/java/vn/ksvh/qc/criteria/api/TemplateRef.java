package vn.ksvh.qc.criteria.api;

import java.util.List;

public record TemplateRef(
        Long id,
        String code,
        String name,
        boolean active,
        Long companyId,
        /** Chỉ tiêu chí đang hoạt động (cả nhóm), đúng thứ tự trong mẫu. */
        List<CriterionRef> items
) {
}

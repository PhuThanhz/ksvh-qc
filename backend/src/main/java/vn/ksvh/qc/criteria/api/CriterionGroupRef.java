package vn.ksvh.qc.criteria.api;

/** Nhóm tiêu chí rút gọn (dùng làm chuyên đề cho kiểm tra đột xuất). companyId null = dùng chung. */
public record CriterionGroupRef(Long id, String code, String name, Long companyId, boolean active) {
}

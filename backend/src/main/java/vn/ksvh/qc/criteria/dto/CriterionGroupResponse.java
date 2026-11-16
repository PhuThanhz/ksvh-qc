package vn.ksvh.qc.criteria.dto;

import vn.ksvh.qc.criteria.domain.CriterionGroup;

public record CriterionGroupResponse(
        Long id,
        String code,
        String name,
        int sortOrder,
        Long companyId,
        String companyName,
        boolean active,
        long criterionCount) {

    public static CriterionGroupResponse from(CriterionGroup g, long criterionCount, String companyName) {
        return new CriterionGroupResponse(
                g.getId(),
                g.getCode(),
                g.getName(),
                g.getSortOrder(),
                g.getCompanyId(),
                companyName,
                g.isActive(),
                criterionCount);
    }
}

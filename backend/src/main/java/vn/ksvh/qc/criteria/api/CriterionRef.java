package vn.ksvh.qc.criteria.api;

public record CriterionRef(
        Long id,
        String code,
        String name,
        String groupName,
        int baseImpact,
        boolean active
) {
}

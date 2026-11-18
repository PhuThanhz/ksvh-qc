package vn.ksvh.qc.criteria.api;

public record CriterionRef(
        Long id,
        String code,
        String name,
        Long groupId,
        String groupName,
        int baseImpact,
        boolean active
) {
    public CriterionRef(Long id, String code, String name, String groupName, int baseImpact, boolean active) {
        this(id, code, name, null, groupName, baseImpact, active);
    }
}

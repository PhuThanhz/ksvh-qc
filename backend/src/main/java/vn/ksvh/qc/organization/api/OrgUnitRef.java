package vn.ksvh.qc.organization.api;

/** Thông tin rút gọn của nhà hàng / phòng ban cho module khác. unitType: RESTAURANT | DEPARTMENT. */
public record OrgUnitRef(
        Long id,
        String code,
        String name,
        String unitType,
        boolean active,
        Double latitude,
        Double longitude,
        Integer checkinRadiusM,
        Long storeManagerUserId,
        Long obmUserId,
        Long companyId,
        RiskPolicy riskPolicy
) {
    public OrgUnitRef(Long id, String code, String name, String unitType, boolean active) {
        this(id, code, name, unitType, active, null, null, null, null, null, null, RiskPolicy.STANDARD);
    }

    public OrgUnitRef(Long id, String code, String name, String unitType, boolean active,
                      Double latitude, Double longitude, Integer checkinRadiusM,
                      Long storeManagerUserId, Long obmUserId, Long companyId) {
        this(id, code, name, unitType, active, latitude, longitude, checkinRadiusM, storeManagerUserId, obmUserId, companyId, RiskPolicy.STANDARD);
    }
}

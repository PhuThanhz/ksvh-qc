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
        Long companyId
) {
    public OrgUnitRef(Long id, String code, String name, String unitType, boolean active) {
        this(id, code, name, unitType, active, null, null, null, null, null, null);
    }
}

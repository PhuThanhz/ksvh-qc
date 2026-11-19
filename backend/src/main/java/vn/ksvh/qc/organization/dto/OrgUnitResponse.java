package vn.ksvh.qc.organization.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import vn.ksvh.qc.organization.domain.OrgUnit;
import vn.ksvh.qc.organization.domain.OrgUnitType;
import vn.ksvh.qc.user.api.UserSummary;

import java.time.Instant;
import java.util.Map;

/** Các trường đánh dấu nullable: phòng ban không có; nhà hàng có thể chưa gán CHT/OBM. */
public record OrgUnitResponse(
        Long id,
        Long companyId,
        String companyCode,
        String companyName,
        OrgUnitType unitType,
        String code,
        String name,
        @Schema(nullable = true) String address,
        @Schema(nullable = true) UserRef storeManager,
        @Schema(nullable = true) UserRef obm,
        @Schema(nullable = true) Double latitude,
        @Schema(nullable = true) Double longitude,
        @Schema(nullable = true) Integer checkinRadiusM,
        boolean active,
        @Schema(nullable = true) Integer escalationThreshold,
        @Schema(nullable = true) Integer escalationResetMonths,
        Instant createdAt,
        Instant updatedAt) {

    /** users: tra sẵn theo id để tránh N+1 khi trả danh sách. */
    public static OrgUnitResponse from(OrgUnit u, Map<Long, UserSummary> users) {
        return new OrgUnitResponse(u.getId(), u.getCompany().getId(), u.getCompany().getCode(), u.getCompany().getName(),
                u.getUnitType(), u.getCode(), u.getName(), u.getAddress(),
                UserRef.from(lookup(users, u.getStoreManagerUserId())), UserRef.from(lookup(users, u.getObmUserId())),
                u.getLatitude(), u.getLongitude(), u.getCheckinRadiusM(), u.isActive(),
                u.getEscalationThreshold() == null ? null : u.getEscalationThreshold().intValue(),
                u.getEscalationResetMonths() == null ? null : u.getEscalationResetMonths().intValue(), u.getCreatedAt(), u.getUpdatedAt());
    }

    private static UserSummary lookup(Map<Long, UserSummary> users, Long id) {
        return id == null ? null : users.get(id);
    }
}

package vn.ksvh.qc.organization.dto;

import vn.ksvh.qc.user.api.UserSummary;

/** Người phụ trách (CHT / OBM) hiển thị kèm đơn vị. */
public record UserRef(Long id, String username, String fullName) {

    public static UserRef from(UserSummary u) {
        return u == null ? null : new UserRef(u.id(), u.username(), u.fullName());
    }
}

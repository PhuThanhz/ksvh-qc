package vn.ksvh.qc.notification.dto;

import vn.ksvh.qc.notification.domain.UserNotificationPreference;

public record NotificationPreferenceResponse(
        Long userId,
        boolean emailEnabled,
        boolean zaloEnabled,
        String customEmail,
        String customPhone,
        String resolvedEmail,
        String resolvedPhone
) {
    public static NotificationPreferenceResponse of(
            UserNotificationPreference pref,
            Long userId,
            String resolvedEmail,
            String resolvedPhone
    ) {
        if (pref == null) {
            return new NotificationPreferenceResponse(userId, true, true, null, null, resolvedEmail, resolvedPhone);
        }
        return new NotificationPreferenceResponse(
                userId,
                pref.isEmailEnabled(),
                pref.isZaloEnabled(),
                pref.getCustomEmail(),
                pref.getCustomPhone(),
                resolvedEmail,
                resolvedPhone
        );
    }
}

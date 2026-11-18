package vn.ksvh.qc.notification.dto;

import jakarta.validation.constraints.Email;

public record NotificationPreferenceRequest(
        boolean emailEnabled,
        boolean zaloEnabled,
        @Email(message = "Email không đúng định dạng")
        String customEmail,
        String customPhone
) {}

package vn.ksvh.qc.notification.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.notification")
public record NotificationProperties(
        Mail mail,
        Zalo zalo
) {
    public NotificationProperties {
        if (mail == null) mail = new Mail(false, "noreply@ksvh.vn", "Hệ Thống KSVH QC");
        if (zalo == null) zalo = new Zalo(false, "KSVH QC Official");
    }

    public record Mail(
            boolean enabled,
            String fromAddress,
            String fromName
    ) {}

    public record Zalo(
            boolean enabled,
            String senderName
    ) {}
}

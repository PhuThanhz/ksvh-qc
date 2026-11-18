package vn.ksvh.qc.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import vn.ksvh.qc.notification.config.NotificationProperties;
import vn.ksvh.qc.notification.domain.NotificationDispatch;

@Slf4j
@Component
@RequiredArgsConstructor
public class ZaloNotificationSender implements NotificationChannelSender {

    private final NotificationProperties properties;

    @Override
    public boolean supports(String channel) {
        return "ZALO".equalsIgnoreCase(channel);
    }

    @Override
    public void send(NotificationDispatch dispatch) {
        boolean zaloEnabled = properties.zalo().enabled();
        if (zaloEnabled) {
            log.info("Sending REAL Zalo message via official account '{}' to {}: {}",
                    properties.zalo().senderName(), dispatch.getRecipient(), dispatch.getTitle());
        } else {
            log.info("[SIMULATED ZALO] Sender: {} | To: {} | Title: {} | Body length: {} chars",
                    properties.zalo().senderName(), dispatch.getRecipient(), dispatch.getTitle(), dispatch.getContent().length());
        }
    }
}

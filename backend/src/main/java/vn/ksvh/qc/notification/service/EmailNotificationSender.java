package vn.ksvh.qc.notification.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import vn.ksvh.qc.notification.config.NotificationProperties;
import vn.ksvh.qc.notification.domain.NotificationDispatch;

import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailNotificationSender implements NotificationChannelSender {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final NotificationProperties properties;

    @Override
    public boolean supports(String channel) {
        return "EMAIL".equalsIgnoreCase(channel);
    }

    @Override
    public void send(NotificationDispatch dispatch) throws Exception {
        boolean mailEnabled = properties.mail().enabled();
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();

        if (mailEnabled && mailSender != null) {
            log.info("Sending REAL email to {} with title '{}'", dispatch.getRecipient(), dispatch.getTitle());
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(properties.mail().fromAddress(), properties.mail().fromName());
            helper.setTo(dispatch.getRecipient());
            helper.setSubject("[KSVH QC] " + dispatch.getTitle());
            helper.setText(dispatch.getContent(), true);
            mailSender.send(message);
        } else {
            log.info("[SIMULATED EMAIL] To: {} | Subject: {} | Content length: {} chars",
                    dispatch.getRecipient(), dispatch.getTitle(), dispatch.getContent().length());
        }
    }
}

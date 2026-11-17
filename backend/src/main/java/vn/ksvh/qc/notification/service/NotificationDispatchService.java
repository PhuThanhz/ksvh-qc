package vn.ksvh.qc.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.employee.api.EmployeeContactInfo;
import vn.ksvh.qc.employee.api.EmployeeLookupApi;
import vn.ksvh.qc.notification.domain.*;
import vn.ksvh.qc.notification.dto.NotificationPreferenceRequest;
import vn.ksvh.qc.notification.dto.NotificationPreferenceResponse;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationDispatchService {

    private final UserNotificationPreferenceRepository preferenceRepository;
    private final NotificationDispatchRepository dispatchRepository;
    private final List<NotificationChannelSender> senders;
    private final EmailTemplateService emailTemplateService;
    private final UserAccountApi userAccountApi;
    private final EmployeeLookupApi employeeLookupApi;

    @Async
    @Transactional
    public void dispatchAsync(Long userId, Long notificationId, String title, String body, String link) {
        dispatchSync(userId, notificationId, title, body, link);
    }

    @Transactional
    public void dispatchSync(Long userId, Long notificationId, String title, String body, String link) {
        if (userId == null) return;

        UserSummary user = userAccountApi.findSummaries(List.of(userId)).get(userId);
        Optional<EmployeeContactInfo> empContact = employeeLookupApi.findContactByUserId(userId);
        UserNotificationPreference pref = preferenceRepository.findById(userId).orElse(null);

        boolean emailEnabled = pref == null || pref.isEmailEnabled();
        boolean zaloEnabled = pref == null || pref.isZaloEnabled();

        String resolvedEmail = resolveEmail(pref, empContact, user);
        String resolvedPhone = resolvePhone(pref, empContact);

        if (emailEnabled && resolvedEmail != null && !resolvedEmail.isBlank()) {
            String recipientName = empContact.map(EmployeeContactInfo::fullName)
                    .orElseGet(() -> user != null ? user.fullName() : "Đồng nghiệp");
            String htmlContent = emailTemplateService.buildHtmlEmail(recipientName, title, body, link);
            createAndSend(notificationId, userId, "EMAIL", resolvedEmail, title, htmlContent);
        }

        if (zaloEnabled && resolvedPhone != null && !resolvedPhone.isBlank()) {
            String zaloContent = title + "\n" + body + (link != null ? "\nChi tiết: " + link : "");
            createAndSend(notificationId, userId, "ZALO", resolvedPhone, title, zaloContent);
        }
    }

    private void createAndSend(Long notifId, Long userId, String channel, String recipient, String title, String content) {
        NotificationDispatch dispatch = new NotificationDispatch(notifId, userId, channel, recipient, title, content);
        dispatch = dispatchRepository.save(dispatch);
        sendSingle(dispatch);
    }

    public void sendSingle(NotificationDispatch dispatch) {
        for (NotificationChannelSender sender : senders) {
            if (sender.supports(dispatch.getChannel())) {
                try {
                    sender.send(dispatch);
                    dispatch.markSent();
                } catch (Exception ex) {
                    log.error("Failed to send notification via {}: {}", dispatch.getChannel(), ex.getMessage());
                    dispatch.markFailed(ex.getMessage());
                }
                dispatchRepository.save(dispatch);
                return;
            }
        }
    }

    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void retryFailedDispatches() {
        List<NotificationDispatch> pendings = dispatchRepository
                .findTop20ByStatusInAndRetryCountLessThanOrderByCreatedAtAsc(List.of("FAILED", "PENDING"), 3);
        if (!pendings.isEmpty()) {
            log.info("Retrying {} pending/failed notification dispatches", pendings.size());
            for (NotificationDispatch d : pendings) {
                sendSingle(d);
            }
        }
    }

    @Transactional(readOnly = true)
    public NotificationPreferenceResponse getPreferences(CurrentUser currentUser) {
        Long uid = currentUser.id();
        UserNotificationPreference pref = preferenceRepository.findById(uid).orElse(null);
        Optional<EmployeeContactInfo> empContact = employeeLookupApi.findContactByUserId(uid);
        UserSummary user = userAccountApi.findSummaries(List.of(uid)).get(uid);

        String resolvedEmail = resolveEmail(pref, empContact, user);
        String resolvedPhone = resolvePhone(pref, empContact);

        return NotificationPreferenceResponse.of(pref, uid, resolvedEmail, resolvedPhone);
    }

    @Transactional
    public NotificationPreferenceResponse updatePreferences(CurrentUser currentUser, NotificationPreferenceRequest req) {
        Long uid = currentUser.id();
        UserNotificationPreference pref = preferenceRepository.findById(uid)
                .orElseGet(() -> new UserNotificationPreference(uid));

        pref.setEmailEnabled(req.emailEnabled());
        pref.setZaloEnabled(req.zaloEnabled());
        pref.setCustomEmail(req.customEmail() != null && !req.customEmail().isBlank() ? req.customEmail().trim() : null);
        pref.setCustomPhone(req.customPhone() != null && !req.customPhone().isBlank() ? req.customPhone().trim() : null);
        pref = preferenceRepository.save(pref);

        Optional<EmployeeContactInfo> empContact = employeeLookupApi.findContactByUserId(uid);
        UserSummary user = userAccountApi.findSummaries(List.of(uid)).get(uid);
        String resolvedEmail = resolveEmail(pref, empContact, user);
        String resolvedPhone = resolvePhone(pref, empContact);

        return NotificationPreferenceResponse.of(pref, uid, resolvedEmail, resolvedPhone);
    }

    private String resolveEmail(UserNotificationPreference pref, Optional<EmployeeContactInfo> empContact, UserSummary user) {
        if (pref != null && pref.getCustomEmail() != null && !pref.getCustomEmail().isBlank()) {
            return pref.getCustomEmail().trim();
        }
        if (empContact.isPresent() && empContact.get().email() != null && !empContact.get().email().isBlank()) {
            return empContact.get().email().trim();
        }
        if (user != null && user.username() != null) {
            String u = user.username().trim();
            if (u.contains("@")) return u;
            return u + "@ksvh.vn";
        }
        return null;
    }

    private String resolvePhone(UserNotificationPreference pref, Optional<EmployeeContactInfo> empContact) {
        if (pref != null && pref.getCustomPhone() != null && !pref.getCustomPhone().isBlank()) {
            return pref.getCustomPhone().trim();
        }
        return empContact.map(EmployeeContactInfo::phone).orElse(null);
    }
}

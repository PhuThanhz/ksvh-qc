package vn.ksvh.qc.notification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.notification.domain.Notification;
import vn.ksvh.qc.notification.domain.NotificationRepository;
import vn.ksvh.qc.notification.domain.NotificationType;
import vn.ksvh.qc.notification.dto.NotificationResponse;
import vn.ksvh.qc.notification.dto.UnreadCountResponse;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.web.PageResponse;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repository;
    private final NotificationDispatchService dispatchService;

    @Transactional
    public Notification create(Long userId, NotificationType type, String title, String body, String link) {
        if (userId == null) {
            return null;
        }
        Notification n = new Notification(userId, type, title, body, link);
        n = repository.save(n);
        dispatchService.dispatchAsync(userId, n.getId(), title, body, link);
        return n;
    }

    @Transactional
    public void createBatch(Collection<Long> userIds, NotificationType type, String title, String body, String link) {
        if (userIds == null || userIds.isEmpty()) {
            return;
        }
        List<Notification> list = userIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .map(uid -> new Notification(uid, type, title, body, link))
                .toList();
        if (!list.isEmpty()) {
            List<Notification> saved = repository.saveAll(list);
            for (Notification n : saved) {
                dispatchService.dispatchAsync(n.getUserId(), n.getId(), title, body, link);
            }
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getMyNotifications(CurrentUser user, Pageable pageable) {
        Page<Notification> page = repository.findByUserIdOrderByCreatedAtDesc(user.id(), pageable);
        return PageResponse.of(page, NotificationResponse::from);
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(CurrentUser user) {
        long count = repository.countByUserIdAndReadAtIsNull(user.id());
        return new UnreadCountResponse(count);
    }

    @Transactional
    public NotificationResponse markAsRead(Long id, CurrentUser user) {
        Notification n = repository.findByIdAndUserId(id, user.id())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy thông báo"));
        if (n.getReadAt() == null) {
            n.setReadAt(Instant.now());
            n = repository.save(n);
        }
        return NotificationResponse.from(n);
    }

    @Transactional
    public void markAllAsRead(CurrentUser user) {
        repository.markAllAsRead(user.id(), Instant.now());
    }
}

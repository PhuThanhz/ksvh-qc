package vn.ksvh.qc.notification.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface NotificationDispatchRepository extends JpaRepository<NotificationDispatch, Long> {

    List<NotificationDispatch> findTop20ByStatusInAndRetryCountLessThanOrderByCreatedAtAsc(
            Collection<String> statuses, int maxRetries);

    Page<NotificationDispatch> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByStatus(String status);
}

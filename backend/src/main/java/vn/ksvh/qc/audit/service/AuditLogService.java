package vn.ksvh.qc.audit.service;

import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.audit.domain.AuditLog;
import vn.ksvh.qc.audit.domain.AuditLogRepository;
import vn.ksvh.qc.audit.dto.AuditLogFilter;
import vn.ksvh.qc.audit.dto.AuditLogResponse;
import vn.ksvh.qc.shared.audit.AuditLogEvent;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;

@Service
@Transactional(readOnly = true)
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final AuditLogRepository auditLogRepository;
    private final org.springframework.beans.factory.ObjectProvider<vn.ksvh.qc.user.api.UserAccountApi> userAccountApi;

    public AuditLogService(AuditLogRepository auditLogRepository,
                           org.springframework.beans.factory.ObjectProvider<vn.ksvh.qc.user.api.UserAccountApi> userAccountApi) {
        this.auditLogRepository = auditLogRepository;
        this.userAccountApi = userAccountApi;
    }

    @Transactional
    public void record(AuditLogEvent event) {
        saveEvent(event);
    }

    @EventListener
    @Transactional
    public void onAuditLogEvent(AuditLogEvent event) {
        saveEvent(event);
    }

    private void saveEvent(AuditLogEvent event) {
        try {
            String username = event.username();
            String fullName = event.userFullName();

            if (event.userId() != null && (username == null || fullName == null)) {
                var api = userAccountApi.getIfAvailable();
                if (api != null) {
                    var summary = api.findSummaries(java.util.List.of(event.userId())).get(event.userId());
                    if (summary != null) {
                        if (username == null) username = summary.username();
                        if (fullName == null) fullName = summary.fullName();
                    }
                }
            }

            if (username == null && event.userId() != null) {
                username = "user#" + event.userId();
            }

            AuditLog logEntity = new AuditLog(
                    event.userId(),
                    username,
                    fullName,
                    event.action(),
                    event.targetType(),
                    event.targetId(),
                    event.summary(),
                    event.ipAddress(),
                    event.details()
            );

            auditLogRepository.save(logEntity);
            log.info("Audit log recorded: [{}] {} on {}:{}", event.action(), username, event.targetType(), event.targetId());
        } catch (Exception e) {
            log.error("Failed to record audit log for event: {}", event, e);
        }
    }

    public Page<AuditLogResponse> search(AuditLogFilter filter, Pageable pageable) {
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(filter.keyword())) {
                String pattern = "%" + filter.keyword().trim().toLowerCase() + "%";
                Predicate matchSummary = cb.like(cb.lower(root.get("summary")), pattern);
                Predicate matchUsername = cb.like(cb.lower(root.get("username")), pattern);
                Predicate matchTarget = cb.like(cb.lower(root.get("targetId")), pattern);
                Predicate matchAction = cb.like(cb.lower(root.get("action")), pattern);
                predicates.add(cb.or(matchSummary, matchUsername, matchTarget, matchAction));
            }

            if (StringUtils.hasText(filter.action())) {
                predicates.add(cb.equal(root.get("action"), filter.action().trim()));
            }

            if (StringUtils.hasText(filter.targetType())) {
                predicates.add(cb.equal(root.get("targetType"), filter.targetType().trim()));
            }

            if (filter.userId() != null) {
                predicates.add(cb.equal(root.get("userId"), filter.userId()));
            }

            if (filter.fromDate() != null) {
                Instant from = filter.fromDate().atStartOfDay(VN_ZONE).toInstant();
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }

            if (filter.toDate() != null) {
                Instant to = filter.toDate().plusDays(1).atStartOfDay(VN_ZONE).toInstant();
                predicates.add(cb.lessThan(root.get("createdAt"), to));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable sortedPageable = pageable.getSort().isSorted()
                ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"));

        return auditLogRepository.findAll(spec, sortedPageable).map(AuditLogResponse::from);
    }

    public AuditLogResponse get(Long id) {
        return auditLogRepository.findById(id)
                .map(AuditLogResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bản ghi nhật ký với ID " + id));
    }

    public List<String> getActions() {
        return auditLogRepository.findDistinctActions();
    }

    public List<String> getTargetTypes() {
        return auditLogRepository.findDistinctTargetTypes();
    }
}

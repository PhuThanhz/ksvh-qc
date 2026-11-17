package vn.ksvh.qc.notification;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import vn.ksvh.qc.inspection.api.event.InspectionAssignedEvent;
import vn.ksvh.qc.inspection.api.event.PlanSubmittedEvent;
import vn.ksvh.qc.notification.domain.Notification;
import vn.ksvh.qc.notification.domain.NotificationRepository;
import vn.ksvh.qc.notification.domain.NotificationType;
import vn.ksvh.qc.notification.service.NotificationService;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.support.ApiTestSupport;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class NotificationFlowTests extends ApiTestSupport {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationService notificationService;

    private static final String[] NOTIF_PERMS = new String[]{};

    @Test
    void testNotificationCrudAndReadStatus() throws Exception {
        long userA = insertUser("notif_a", RoleCodes.KSVH_INSPECTOR);
        long userB = insertUser("notif_b", RoleCodes.STORE_MANAGER);

        // 1. Gửi 2 thông báo cho userA, 1 thông báo cho userB
        notificationService.create(userA, NotificationType.INSPECTION_ASSIGNED,
                "Phân công mới", "Bạn được phân công kiểm tra cửa hàng A", "/qc/inspections/10");
        notificationService.create(userA, NotificationType.FINDING_VERIFIED,
                "Kết quả nghiệm thu", "Lỗi đã được duyệt đạt", "/inspections/10/findings/1");
        notificationService.create(userB, NotificationType.INSPECTION_SUBMITTED,
                "Có biên bản mới", "Biên bản kiểm tra đã được gửi", "/inspections/10");

        // 2. UserA kiểm tra danh sách thông báo
        mvc.perform(get("/api/v1/notifications").with(as(userA, NOTIF_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(2))
                .andExpect(jsonPath("$.items[0].read").value(false))
                .andExpect(jsonPath("$.items[1].read").value(false));

        // 3. UserA kiểm tra unread count
        mvc.perform(get("/api/v1/notifications/unread-count").with(as(userA, NOTIF_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(2));

        // UserB unread count = 1
        mvc.perform(get("/api/v1/notifications/unread-count").with(as(userB, NOTIF_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(1));

        // 4. Lấy ID thông báo của userA và đánh dấu đã đọc
        List<Notification> userANotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(userA, org.springframework.data.domain.Pageable.unpaged()).getContent();
        assertThat(userANotifs).hasSize(2);
        long firstId = userANotifs.get(0).getId();

        mvc.perform(post("/api/v1/notifications/" + firstId + "/read").with(as(userA, NOTIF_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(firstId))
                .andExpect(jsonPath("$.read").value(true));

        // Unread count giảm xuống 1
        mvc.perform(get("/api/v1/notifications/unread-count").with(as(userA, NOTIF_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(1));

        // 5. UserB cố tình đọc thông báo của UserA -> 404
        mvc.perform(post("/api/v1/notifications/" + firstId + "/read").with(as(userB, NOTIF_PERMS)))
                .andExpect(status().isNotFound());

        // 6. UserA đánh dấu tất cả đã đọc
        mvc.perform(post("/api/v1/notifications/read-all").with(as(userA, NOTIF_PERMS)))
                .andExpect(status().isNoContent());

        // Unread count trở về 0
        mvc.perform(get("/api/v1/notifications/unread-count").with(as(userA, NOTIF_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(0));
    }

    @Test
    void testNotificationEventListener() {
        long managerId = insertUser("mgr", RoleCodes.KSVH_MANAGER);
        long inspectorId = insertUser("insp", RoleCodes.KSVH_INSPECTOR);

        // Test event PlanSubmittedEvent
        context.publishEvent(new PlanSubmittedEvent(100L, "PL-TEST-001", "Kế hoạch tuần 1", inspectorId, "Nguyễn Văn Inspector"));

        List<Notification> managerNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(managerId, org.springframework.data.domain.Pageable.unpaged()).getContent();
        assertThat(managerNotifs).isNotEmpty();
        assertThat(managerNotifs.get(0).getType()).isEqualTo(NotificationType.PLAN_SUBMITTED);
        assertThat(managerNotifs.get(0).getTitle()).contains("chờ duyệt");
        assertThat(managerNotifs.get(0).getLink()).isEqualTo("/admin/inspections/plans");

        // Test event InspectionAssignedEvent
        context.publishEvent(new InspectionAssignedEvent(200L, "PER-2611-TEST-01", 1L, "Nhà hàng Test", inspectorId, "Định kỳ"));

        List<Notification> inspectorNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(inspectorId, org.springframework.data.domain.Pageable.unpaged()).getContent();
        assertThat(inspectorNotifs).isNotEmpty();
        assertThat(inspectorNotifs.get(0).getType()).isEqualTo(NotificationType.INSPECTION_ASSIGNED);
        assertThat(inspectorNotifs.get(0).getTitle()).contains("phân công");
        assertThat(inspectorNotifs.get(0).getLink()).isEqualTo("/admin/inspections");
    }

    private long insertUser(String prefix, String roleCode) {
        Long id = jdbc.queryForObject("""
                INSERT INTO users (username, password_hash, full_name, active) VALUES (?, '{noop}x', ?, true) RETURNING id
                """, Long.class, prefix + "_" + suffix.toLowerCase(), "Test " + prefix + " " + suffix);
        jdbc.update("INSERT INTO user_roles (user_id, role_id) SELECT ?, id FROM roles WHERE code = ?", id, roleCode);
        return id;
    }
}

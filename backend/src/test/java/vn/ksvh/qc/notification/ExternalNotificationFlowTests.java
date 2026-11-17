package vn.ksvh.qc.notification;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import vn.ksvh.qc.notification.domain.NotificationDispatch;
import vn.ksvh.qc.notification.domain.NotificationDispatchRepository;
import vn.ksvh.qc.notification.domain.NotificationType;
import vn.ksvh.qc.notification.service.NotificationDispatchService;
import vn.ksvh.qc.notification.service.NotificationService;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.support.ApiTestSupport;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ExternalNotificationFlowTests extends ApiTestSupport {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationDispatchService dispatchService;

    @Autowired
    private NotificationDispatchRepository dispatchRepository;

    private static final String[] NO_PERMS = new String[]{};

    @Test
    void testGetAndUpdateNotificationPreferences() throws Exception {
        long userId = insertUser("notif_pref_user", RoleCodes.KSVH_INSPECTOR);

        // 1. Mặc định cả email và zalo đều bật
        mvc.perform(get("/api/v1/notifications/preferences").with(as(userId, NO_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailEnabled").value(true))
                .andExpect(jsonPath("$.zaloEnabled").value(true));

        // 2. Cập nhật tắt Zalo, đặt email tuỳ chọn
        String reqBody = """
                {
                    "emailEnabled": true,
                    "zaloEnabled": false,
                    "customEmail": "inspector_lead@company.vn",
                    "customPhone": "0912345678"
                }
                """;

        mvc.perform(put("/api/v1/notifications/preferences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqBody)
                        .with(as(userId, NO_PERMS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailEnabled").value(true))
                .andExpect(jsonPath("$.zaloEnabled").value(false))
                .andExpect(jsonPath("$.customEmail").value("inspector_lead@company.vn"))
                .andExpect(jsonPath("$.customPhone").value("0912345678"))
                .andExpect(jsonPath("$.resolvedEmail").value("inspector_lead@company.vn"));
    }

    @Test
    void testDispatchCreatedWhenNotificationCreated() {
        long userId = insertUser("dispatch_user", RoleCodes.STORE_MANAGER);

        // Tạo thông báo
        var n = notificationService.create(
                userId,
                NotificationType.FINDING_M4_ALERT,
                "CẢNH BÁO SỰ CỐ M4",
                "Phát hiện lỗi vi phạm mức nghiêm trọng M4",
                "/admin/inspections/findings?id=999"
        );

        // Dispatch đồng bộ kiểm tra
        dispatchService.dispatchSync(userId, n.getId(), "CẢNH BÁO SỰ CỐ M4", "Nội dung sự cố", "/admin");

        List<NotificationDispatch> dispatches = dispatchRepository.findAll().stream()
                .filter(d -> d.getUserId().equals(userId))
                .toList();

        assertThat(dispatches).isNotEmpty();
        NotificationDispatch emailDispatch = dispatches.stream()
                .filter(d -> "EMAIL".equals(d.getChannel()))
                .findFirst()
                .orElse(null);

        assertThat(emailDispatch).isNotNull();
        assertThat(emailDispatch.getStatus()).isEqualTo("SENT");
        assertThat(emailDispatch.getContent()).contains("KSVH QC SYSTEM");
        assertThat(emailDispatch.getContent()).contains("Xem chi tiết trên hệ thống");
    }

    @Test
    void testRetryFailedDispatches() {
        long userId = insertUser("retry_user", RoleCodes.KSVH_MANAGER);

        var n = notificationService.create(
                userId,
                NotificationType.PLAN_APPROVED,
                "Kế hoạch được duyệt",
                "Kế hoạch đã được duyệt",
                "/admin/inspections/plans"
        );

        NotificationDispatch failedDispatch = new NotificationDispatch(
                n.getId(), userId, "EMAIL", "retry@test.vn", "Tiêu đề test retry", "<p>Nội dung</p>");
        failedDispatch.markFailed("Simulated network timeout");
        dispatchRepository.save(failedDispatch);

        assertThat(failedDispatch.getRetryCount()).isEqualTo(1);
        assertThat(failedDispatch.getStatus()).isEqualTo("FAILED");

        // Chạy job retry
        dispatchService.retryFailedDispatches();

        NotificationDispatch afterRetry = dispatchRepository.findById(failedDispatch.getId()).orElseThrow();
        assertThat(afterRetry.getStatus()).isEqualTo("SENT");
        assertThat(afterRetry.getLastError()).isNull();
    }
}

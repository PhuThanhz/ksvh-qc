package vn.ksvh.qc.notification.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import vn.ksvh.qc.notification.dto.NotificationResponse;
import vn.ksvh.qc.notification.dto.UnreadCountResponse;
import vn.ksvh.qc.notification.service.NotificationService;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.shared.web.PageResponse;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Quản lý thông báo trong ứng dụng cho người dùng")
public class NotificationController {

    private final NotificationService notificationService;
    private final vn.ksvh.qc.notification.service.NotificationDispatchService notificationDispatchService;

    @GetMapping
    @Operation(summary = "Danh sách thông báo của người dùng hiện tại (phân trang)")
    public PageResponse<NotificationResponse> getMyNotifications(
            @AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return notificationService.getMyNotifications(CurrentUser.from(jwt), pageable);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Đếm số thông báo chưa đọc của người dùng hiện tại")
    public UnreadCountResponse getUnreadCount(@AuthenticationPrincipal Jwt jwt) {
        return notificationService.getUnreadCount(CurrentUser.from(jwt));
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "Đánh dấu thông báo đã đọc")
    public NotificationResponse markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return notificationService.markAsRead(id, CurrentUser.from(jwt));
    }

    @PostMapping("/read-all")
    @Operation(summary = "Đánh dấu tất cả thông báo của tôi là đã đọc")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal Jwt jwt) {
        notificationService.markAllAsRead(CurrentUser.from(jwt));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/preferences")
    @Operation(summary = "Lấy cấu hình kênh nhận thông báo của người dùng hiện tại")
    public vn.ksvh.qc.notification.dto.NotificationPreferenceResponse getPreferences(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return notificationDispatchService.getPreferences(CurrentUser.from(jwt));
    }

    @PutMapping("/preferences")
    @Operation(summary = "Cập nhật cấu hình kênh nhận thông báo của người dùng hiện tại")
    public vn.ksvh.qc.notification.dto.NotificationPreferenceResponse updatePreferences(
            @AuthenticationPrincipal Jwt jwt,
            @jakarta.validation.Valid @RequestBody vn.ksvh.qc.notification.dto.NotificationPreferenceRequest request
    ) {
        return notificationDispatchService.updatePreferences(CurrentUser.from(jwt), request);
    }
}

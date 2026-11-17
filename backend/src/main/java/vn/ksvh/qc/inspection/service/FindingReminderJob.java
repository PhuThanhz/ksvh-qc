package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Chạy mỗi ngày lúc 08:00 giờ Việt Nam: quét các lỗi sắp đến hạn khắc phục vào ngày mai
 * và phát sự kiện FindingReminderDueEvent để thông báo cho nhà hàng.
 */
@Slf4j
@Component
@RequiredArgsConstructor
class FindingReminderJob {

    private final FindingService findingService;

    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Ho_Chi_Minh")
    void run() {
        int count = findingService.sendDueReminders();
        if (count > 0) {
            log.info("Job nhắc sắp đến hạn khắc phục: đã gửi thông báo cho {} lỗi sắp hết hạn vào ngày mai", count);
        }
    }
}

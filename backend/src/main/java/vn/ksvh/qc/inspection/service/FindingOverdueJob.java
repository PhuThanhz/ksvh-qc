package vn.ksvh.qc.inspection.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Chạy mỗi ngày lúc 00:05 giờ Việt Nam: lỗi quá hạn khắc phục → +1 tần suất, mở vòng mới (xem FindingService). */
@Slf4j
@Component
@RequiredArgsConstructor
class FindingOverdueJob {

    private final FindingService findingService;

    @Scheduled(cron = "0 5 0 * * *", zone = "Asia/Ho_Chi_Minh")
    void run() {
        int count = findingService.markOverdueFindings();
        if (count > 0) {
            log.info("Job quá hạn khắc phục: đã +1 tần suất và mở vòng mới cho {} lỗi", count);
        }
    }
}

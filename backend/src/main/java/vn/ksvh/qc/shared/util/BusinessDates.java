package vn.ksvh.qc.shared.util;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

/** Ngày nghiệp vụ tính theo giờ Việt Nam (DB và Clock vẫn ở UTC). */
public final class BusinessDates {

    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private BusinessDates() {
    }

    public static LocalDate today(Clock clock) {
        return LocalDate.now(clock.withZone(ZONE));
    }
}

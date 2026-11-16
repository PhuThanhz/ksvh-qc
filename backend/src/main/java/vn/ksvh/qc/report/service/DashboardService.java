package vn.ksvh.qc.report.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.report.dto.DashboardResponse;
import vn.ksvh.qc.report.dto.DashboardResponse.CountItem;
import vn.ksvh.qc.report.dto.DashboardResponse.Kpis;
import vn.ksvh.qc.report.dto.DashboardResponse.MonthPoint;
import vn.ksvh.qc.report.dto.DashboardResponse.RestaurantRisk;
import vn.ksvh.qc.shared.util.BusinessDates;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Thống kê cho trang Tổng quan. Chỉ đọc, tổng hợp bằng SQL (không tải từng bản ghi).
 * Lỗi "đang mở" = chưa đóng và chưa bị bỏ (OPEN, CONFIRMED, APPEALED, REMEDIATING, PENDING_VERIFICATION).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private static final String TZ = "Asia/Ho_Chi_Minh";
    private static final String OPEN = "('OPEN','CONFIRMED','APPEALED','REMEDIATING','PENDING_VERIFICATION')";
    private static final Map<String, String> STATUS_LABELS = Map.of(
            "OPEN", "Chờ xác nhận", "CONFIRMED", "Đã xác nhận", "APPEALED", "Đang khiếu nại",
            "REMEDIATING", "Đang khắc phục", "PENDING_VERIFICATION", "Chờ nghiệm thu",
            "CLOSED", "Đã đóng", "DISMISSED", "Đã bỏ");
    private static final List<String> STATUS_ORDER = List.of(
            "OPEN", "CONFIRMED", "APPEALED", "REMEDIATING", "PENDING_VERIFICATION", "CLOSED", "DISMISSED");

    private final JdbcTemplate jdbc;
    private final Clock clock;

    public DashboardResponse summary(int months) {
        LocalDate today = BusinessDates.today(clock);
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate periodStart = monthStart.minusMonths(months - 1L);
        return new DashboardResponse(kpis(today, monthStart, periodStart), trend(periodStart, monthStart),
                openByRiskLevel(), byStatus(periodStart), topRestaurants(), topCriteria(periodStart));
    }

    private Kpis kpis(LocalDate today, LocalDate monthStart, LocalDate periodStart) {
        String submittedDay = "(submitted_at AT TIME ZONE '" + TZ + "')::date";
        long thisMonth = count("SELECT count(*) FROM inspections WHERE " + submittedDay + " >= ?", monthStart);
        long lastMonth = count("SELECT count(*) FROM inspections WHERE " + submittedDay + " >= ? AND " + submittedDay + " < ?",
                monthStart.minusMonths(1), monthStart);
        long restaurants = count("SELECT count(DISTINCT restaurant_id) FROM inspections WHERE " + submittedDay + " >= ?", monthStart);
        long open = count("SELECT count(*) FROM findings WHERE status IN " + OPEN);
        long overdue = count("SELECT count(*) FROM findings WHERE status IN " + OPEN + " AND deadline_date < ?", today);
        Map<String, Object> closed = jdbc.queryForMap("""
                SELECT count(*) AS total,
                       count(*) FILTER (WHERE (verified_at AT TIME ZONE '%s')::date <= deadline_date) AS on_time
                FROM findings WHERE status = 'CLOSED' AND (verified_at AT TIME ZONE '%s')::date >= ?
                """.formatted(TZ, TZ), Date.valueOf(periodStart));
        long total = ((Number) closed.get("total")).longValue();
        BigDecimal rate = total == 0 ? null : BigDecimal.valueOf(((Number) closed.get("on_time")).longValue() * 100.0 / total)
                .setScale(1, RoundingMode.HALF_UP);
        return new Kpis(thisMonth, lastMonth, restaurants, open, overdue, rate);
    }

    private List<MonthPoint> trend(LocalDate periodStart, LocalDate monthStart) {
        return jdbc.query("""
                SELECT to_char(m, 'YYYY-MM') AS month,
                       (SELECT count(*) FROM inspections i
                         WHERE date_trunc('month', i.submitted_at AT TIME ZONE '%1$s') = m) AS inspections,
                       (SELECT count(*) FROM findings f
                         WHERE date_trunc('month', f.created_at AT TIME ZONE '%1$s') = m) AS findings
                FROM generate_series(?::timestamp, ?::timestamp, interval '1 month') AS m
                ORDER BY m
                """.formatted(TZ),
                (rs, i) -> new MonthPoint(rs.getString("month"), rs.getLong("inspections"), rs.getLong("findings")),
                Date.valueOf(periodStart), Date.valueOf(monthStart));
    }

    private List<CountItem> openByRiskLevel() {
        return jdbc.query("""
                SELECT risk_level_code AS key, max(risk_level_name) AS label, count(*) AS cnt
                FROM findings WHERE status IN %s
                GROUP BY risk_level_code ORDER BY risk_level_code
                """.formatted(OPEN),
                (rs, i) -> new CountItem(rs.getString("key"), rs.getString("label"), rs.getLong("cnt")));
    }

    private List<CountItem> byStatus(LocalDate periodStart) {
        Map<String, Long> counts = new java.util.HashMap<>();
        jdbc.query("""
                SELECT status, count(*) AS cnt FROM findings
                WHERE (created_at AT TIME ZONE '%s')::date >= ? GROUP BY status
                """.formatted(TZ), rs -> {
            counts.put(rs.getString("status"), rs.getLong("cnt"));
        }, Date.valueOf(periodStart));
        return STATUS_ORDER.stream().map(s -> new CountItem(s, STATUS_LABELS.get(s), counts.getOrDefault(s, 0L))).toList();
    }

    private List<RestaurantRisk> topRestaurants() {
        return jdbc.query("""
                SELECT u.id, u.code, u.name, count(*) AS open_findings, coalesce(sum(f.calculated_score), 0) AS score
                FROM findings f JOIN org_units u ON u.id = f.restaurant_id
                WHERE f.status IN %s
                GROUP BY u.id, u.code, u.name
                ORDER BY score DESC, open_findings DESC, u.code LIMIT 5
                """.formatted(OPEN),
                (rs, i) -> new RestaurantRisk(rs.getLong("id"), rs.getString("code"), rs.getString("name"),
                        rs.getLong("open_findings"), rs.getLong("score")));
    }

    private List<CountItem> topCriteria(LocalDate periodStart) {
        return jdbc.query("""
                SELECT c.code AS key, c.name AS label, count(*) AS cnt
                FROM findings f JOIN criteria c ON c.id = f.criterion_id
                WHERE f.status <> 'DISMISSED' AND (f.created_at AT TIME ZONE '%s')::date >= ?
                GROUP BY c.code, c.name ORDER BY cnt DESC, c.code LIMIT 5
                """.formatted(TZ),
                (rs, i) -> new CountItem(rs.getString("key"), rs.getString("label"), rs.getLong("cnt")),
                Date.valueOf(periodStart));
    }

    private long count(String sql, LocalDate... dates) {
        Object[] args = java.util.Arrays.stream(dates).map(Date::valueOf).toArray();
        Long v = jdbc.queryForObject(sql, Long.class, args);
        return v == null ? 0 : v;
    }
}

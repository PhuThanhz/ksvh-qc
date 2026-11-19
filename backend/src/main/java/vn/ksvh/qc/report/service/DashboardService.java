package vn.ksvh.qc.report.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.report.dto.ApprovalQueueResponse;
import vn.ksvh.qc.report.dto.DashboardResponse;
import vn.ksvh.qc.report.dto.DashboardResponse.CountItem;
import vn.ksvh.qc.report.dto.DashboardResponse.Kpis;
import vn.ksvh.qc.report.dto.DashboardResponse.MonthPoint;
import vn.ksvh.qc.report.dto.DashboardResponse.RestaurantCompliance;
import vn.ksvh.qc.report.dto.DashboardResponse.RestaurantRisk;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.util.BusinessDates;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.Clock;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Thống kê cho trang Tổng quan chuẩn PDF KSVH.
 * Chỉ đọc, tổng hợp bằng SQL (không tải từng bản ghi).
 * Lỗi "đang mở" = chưa đóng và chưa bị bỏ (OPEN, CONFIRMED, APPEALED, REMEDIATING, PENDING_VERIFICATION).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private static final String OPEN = "('OPEN','CONFIRMED','APPEALED','REMEDIATING','PENDING_VERIFICATION')";
    private static final Map<String, String> STATUS_LABELS = Map.of(
            "OPEN", "Chờ xác nhận", "CONFIRMED", "Đã xác nhận", "APPEALED", "Đang khiếu nại",
            "REMEDIATING", "Đang khắc phục", "PENDING_VERIFICATION", "Chờ nghiệm thu",
            "CLOSED", "Đã đóng", "DISMISSED", "Đã bỏ");
    private static final List<String> STATUS_ORDER = List.of(
            "OPEN", "CONFIRMED", "APPEALED", "REMEDIATING", "PENDING_VERIFICATION", "CLOSED", "DISMISSED");

    private final JdbcTemplate jdbc;
    private final Clock clock;

    /** Kỳ dài nhất cho phép (khoảng 3 năm) để truy vấn và biểu đồ xu hướng theo tháng không quá nặng. */
    private static final int MAX_PERIOD_DAYS = 1100;
    /** Kỳ mặc định khi không chọn: 6 tháng gần nhất. */
    private static final int DEFAULT_MONTHS = 6;

    /** Số liệu Tổng quan cho kỳ [from, to]; null → mặc định 6 tháng gần nhất tính đến hôm nay. */
    public DashboardResponse summary(LocalDate from, LocalDate to) {
        LocalDate today = BusinessDates.today(clock);
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate periodEnd = to != null ? to : today;
        LocalDate periodStart = from != null ? from : periodEnd.withDayOfMonth(1).minusMonths(DEFAULT_MONTHS - 1L);
        if (periodStart.isAfter(periodEnd)) {
            throw new BusinessException(ErrorCode.REPORT_INVALID_PERIOD, "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
        }
        if (periodStart.plusDays(MAX_PERIOD_DAYS).isBefore(periodEnd)) {
            throw new BusinessException(ErrorCode.REPORT_INVALID_PERIOD, "Kỳ thống kê tối đa khoảng 3 năm");
        }
        Period period = new Period(periodStart, periodEnd.plusDays(1));
        List<RestaurantCompliance> restComp = restaurantCompliance(period);
        return new DashboardResponse(
                kpis(today, monthStart, period, restComp),
                trend(period),
                openByRiskLevel(),
                byStatus(period),
                topRestaurants(),
                topCriteria(period),
                restComp
        );
    }

    /** Kỳ nửa mở [start, endExclusive) theo ngày. */
    private record Period(LocalDate start, LocalDate endExclusive) {
        Date startSql() { return Date.valueOf(start); }
        Date endSql() { return Date.valueOf(endExclusive); }
    }

    private Kpis kpis(LocalDate today, LocalDate monthStart, Period period, List<RestaurantCompliance> restComp) {
        Map<String, Object> inspKpis = jdbc.queryForMap("""
                SELECT
                    SUM(CASE WHEN DATE(submitted_at) >= ? THEN 1 ELSE 0 END) AS this_month,
                    SUM(CASE WHEN DATE(submitted_at) >= ? AND DATE(submitted_at) < ? THEN 1 ELSE 0 END) AS last_month,
                    COUNT(DISTINCT CASE WHEN DATE(submitted_at) >= ? THEN restaurant_id END) AS restaurants
                FROM inspections
                """,
                Date.valueOf(monthStart), Date.valueOf(monthStart.minusMonths(1)),
                Date.valueOf(monthStart), Date.valueOf(monthStart));
        long thisMonth = inspKpis.get("this_month") != null ? ((Number) inspKpis.get("this_month")).longValue() : 0L;
        long lastMonth = inspKpis.get("last_month") != null ? ((Number) inspKpis.get("last_month")).longValue() : 0L;
        long restaurants = inspKpis.get("restaurants") != null ? ((Number) inspKpis.get("restaurants")).longValue() : 0L;

        Map<String, Object> findKpis = jdbc.queryForMap("""
                SELECT
                    COUNT(*) AS open_cnt,
                    SUM(CASE WHEN risk_level_code IN ('M3', 'M4') THEN 1 ELSE 0 END) AS high_risk_cnt,
                    SUM(CASE WHEN deadline_date < ? THEN 1 ELSE 0 END) AS overdue_cnt
                FROM findings WHERE status IN """ + OPEN, Date.valueOf(today));
        long open = findKpis.get("open_cnt") != null ? ((Number) findKpis.get("open_cnt")).longValue() : 0L;
        long highRisk = findKpis.get("high_risk_cnt") != null ? ((Number) findKpis.get("high_risk_cnt")).longValue() : 0L;
        long overdue = findKpis.get("overdue_cnt") != null ? ((Number) findKpis.get("overdue_cnt")).longValue() : 0L;

        Map<String, Object> closed = jdbc.queryForMap("""
                SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN DATE(verified_at) <= deadline_date THEN 1 ELSE 0 END) AS on_time
                FROM findings WHERE status = 'CLOSED' AND DATE(verified_at) >= ? AND DATE(verified_at) < ?
                """, period.startSql(), period.endSql());
        long total = closed.get("total") != null ? ((Number) closed.get("total")).longValue() : 0L;
        long onTime = closed.get("on_time") != null ? ((Number) closed.get("on_time")).longValue() : 0L;
        BigDecimal rate = total == 0 ? null : BigDecimal.valueOf(onTime * 100.0 / total).setScale(1, RoundingMode.HALF_UP);

        BigDecimal complianceAvg = restComp.stream()
                .map(RestaurantCompliance::complianceScore)
                .filter(Objects::nonNull)
                .collect(Collectors.collectingAndThen(
                        Collectors.averagingDouble(BigDecimal::doubleValue),
                        avg -> avg.isNaN() ? null : BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP)
                ));

        return new Kpis(complianceAvg, open, highRisk, thisMonth, lastMonth, restaurants, overdue, rate);
    }

    private List<MonthPoint> trend(Period period) {
        Map<String, Long> inspMap = new HashMap<>();
        jdbc.query("""
                SELECT to_char(submitted_at, 'YYYY-MM') AS ym, COUNT(*) AS cnt
                FROM inspections
                WHERE DATE(submitted_at) >= ? AND DATE(submitted_at) < ?
                GROUP BY to_char(submitted_at, 'YYYY-MM')
                """, rs -> {
            inspMap.put(rs.getString("ym"), rs.getLong("cnt"));
        }, period.startSql(), period.endSql());

        Map<String, Long> findMap = new HashMap<>();
        jdbc.query("""
                SELECT to_char(created_at, 'YYYY-MM') AS ym, COUNT(*) AS cnt
                FROM findings
                WHERE DATE(created_at) >= ? AND DATE(created_at) < ?
                GROUP BY to_char(created_at, 'YYYY-MM')
                """, rs -> {
            findMap.put(rs.getString("ym"), rs.getLong("cnt"));
        }, period.startSql(), period.endSql());

        List<MonthPoint> points = new ArrayList<>();
        LocalDate cur = period.start().withDayOfMonth(1);
        LocalDate lastMonth = period.endExclusive().minusDays(1).withDayOfMonth(1);
        while (!cur.isAfter(lastMonth)) {
            String ym = String.format("%04d-%02d", cur.getYear(), cur.getMonthValue());
            points.add(new MonthPoint(ym, inspMap.getOrDefault(ym, 0L), findMap.getOrDefault(ym, 0L)));
            cur = cur.plusMonths(1);
        }
        return points;
    }

    private List<CountItem> openByRiskLevel() {
        return jdbc.query("""
                SELECT risk_level_code AS code_key, MAX(risk_level_name) AS label, COUNT(*) AS cnt
                FROM findings WHERE status IN """ + OPEN + """
                GROUP BY risk_level_code ORDER BY risk_level_code
                """,
                (rs, i) -> new CountItem(rs.getString("code_key"), rs.getString("label"), rs.getLong("cnt")));
    }

    private List<CountItem> byStatus(Period period) {
        Map<String, Long> counts = new HashMap<>();
        jdbc.query("""
                SELECT status, COUNT(*) AS cnt FROM findings
                WHERE DATE(created_at) >= ? AND DATE(created_at) < ? GROUP BY status
                """, rs -> {
            counts.put(rs.getString("status"), rs.getLong("cnt"));
        }, period.startSql(), period.endSql());
        return STATUS_ORDER.stream().map(s -> new CountItem(s, STATUS_LABELS.get(s), counts.getOrDefault(s, 0L))).toList();
    }

    private List<RestaurantRisk> topRestaurants() {
        return jdbc.query("""
                SELECT u.id, u.code, u.name, COUNT(*) AS open_findings, COALESCE(SUM(f.calculated_score), 0) AS score
                FROM findings f JOIN org_units u ON u.id = f.restaurant_id
                WHERE f.status IN """ + OPEN + """
                GROUP BY u.id, u.code, u.name
                ORDER BY score DESC, open_findings DESC, u.code LIMIT 5
                """,
                (rs, i) -> new RestaurantRisk(rs.getLong("id"), rs.getString("code"), rs.getString("name"),
                        rs.getLong("open_findings"), rs.getLong("score")));
    }

    private List<CountItem> topCriteria(Period period) {
        return jdbc.query("""
                SELECT c.code AS code_key, c.name AS label, COUNT(*) AS cnt
                FROM findings f JOIN criteria c ON c.id = f.criterion_id
                WHERE f.status <> 'DISMISSED' AND DATE(f.created_at) >= ? AND DATE(f.created_at) < ?
                GROUP BY c.code, c.name ORDER BY cnt DESC, c.code LIMIT 5
                """,
                (rs, i) -> new CountItem(rs.getString("code_key"), rs.getString("label"), rs.getLong("cnt")),
                period.startSql(), period.endSql());
    }

    private List<RestaurantCompliance> restaurantCompliance(Period period) {
        return jdbc.query("""
                SELECT
                    u.id, u.code, u.name,
                    COALESCE(SUM(CASE WHEN ii.result = 'PASS' THEN ii.base_impact ELSE 0 END), 0) AS pass_weight,
                    COALESCE(SUM(CASE WHEN ii.result = 'FAIL' THEN ii.base_impact ELSE 0 END), 0) AS fail_weight
                FROM org_units u
                LEFT JOIN inspections i ON i.restaurant_id = u.id AND i.status IN ('COMPLETED', 'AWAITING_ACK') AND DATE(i.submitted_at) >= ? AND DATE(i.submitted_at) < ?
                LEFT JOIN inspection_items ii ON ii.inspection_id = i.id
                WHERE u.unit_type = 'RESTAURANT' AND u.active = true
                GROUP BY u.id, u.code, u.name
                ORDER BY u.code
                """, (rs, i) -> {
            long passW = rs.getLong("pass_weight");
            long failW = rs.getLong("fail_weight");
            long totalW = passW + failW;
            BigDecimal score = totalW == 0 ? null
                    : BigDecimal.valueOf(passW * 100.0 / totalW).setScale(1, RoundingMode.HALF_UP);
            boolean attention = score != null && score.compareTo(BigDecimal.valueOf(85)) < 0;
            return new RestaurantCompliance(rs.getLong("id"), rs.getString("code"), rs.getString("name"), score, attention);
        }, period.startSql(), period.endSql());
    }

    public ApprovalQueueResponse getApprovalQueue() {
        List<ApprovalQueueResponse.PendingPlanItem> pendingPlans = jdbc.query("""
                SELECT p.id, p.plan_code, p.title, p.start_date, p.end_date, p.created_at,
                       COUNT(a.id) AS restaurant_count
                FROM inspection_plans p
                LEFT JOIN inspection_plan_assignments a ON a.plan_id = p.id
                WHERE p.status = 'PENDING_APPROVAL'
                GROUP BY p.id, p.plan_code, p.title, p.start_date, p.end_date, p.created_at
                ORDER BY p.created_at ASC
                """, (rs, i) -> new ApprovalQueueResponse.PendingPlanItem(
                rs.getLong("id"),
                rs.getString("plan_code"),
                rs.getString("title"),
                rs.getDate("start_date") != null ? rs.getDate("start_date").toLocalDate() : null,
                rs.getDate("end_date") != null ? rs.getDate("end_date").toLocalDate() : null,
                rs.getInt("restaurant_count"),
                rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toInstant() : null
        ));

        List<ApprovalQueueResponse.AppealMeetingItem> appealMeetings = jdbc.query("""
                SELECT f.id, f.inspection_id, f.restaurant_id, f.risk_level_code, f.appeal_reason, f.updated_at,
                       i.code AS inspection_code, o.name AS restaurant_name
                FROM findings f
                LEFT JOIN inspections i ON i.id = f.inspection_id
                LEFT JOIN org_units o ON o.id = f.restaurant_id
                WHERE f.status = 'APPEAL_MEETING'
                ORDER BY f.updated_at ASC
                """, (rs, i) -> new ApprovalQueueResponse.AppealMeetingItem(
                rs.getLong("id"),
                rs.getLong("inspection_id"),
                rs.getString("inspection_code"),
                rs.getLong("restaurant_id"),
                rs.getString("restaurant_name"),
                rs.getString("risk_level_code"),
                rs.getString("appeal_reason"),
                rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toInstant() : null
        ));

        return new ApprovalQueueResponse(pendingPlans, appealMeetings);
    }
}

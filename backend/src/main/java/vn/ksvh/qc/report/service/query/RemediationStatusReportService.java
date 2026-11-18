package vn.ksvh.qc.report.service.query;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.report.dto.RemediationStatusReportResponse;
import vn.ksvh.qc.report.dto.RemediationStatusReportResponse.RemediationStatusItem;
import vn.ksvh.qc.report.dto.ReportFilter;
import vn.ksvh.qc.shared.excel.ExcelSheet;
import vn.ksvh.qc.shared.excel.ExcelWriter;
import vn.ksvh.qc.shared.util.BusinessDates;

import java.sql.Date;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RemediationStatusReportService {

    private final JdbcTemplate jdbc;
    private final Clock clock;

    public RemediationStatusReportResponse getRemediationStatus(ReportFilter filter) {
        LocalDate today = BusinessDates.today(clock);
        LocalDate from = filter.safeFrom(today.minusMonths(6).withDayOfMonth(1));
        LocalDate to = filter.safeTo(today);

        List<Object> params = new ArrayList<>();
        params.add(Date.valueOf(today));
        params.add(Date.valueOf(today));
        params.add(Date.valueOf(from));
        params.add(Date.valueOf(to));

        StringBuilder extraWhere = new StringBuilder();
        if (filter.companyId() != null) {
            extraWhere.append(" AND r.company_id = ?");
            params.add(filter.companyId());
        }
        if (filter.restaurantId() != null) {
            extraWhere.append(" AND r.id = ?");
            params.add(filter.restaurantId());
        }

        String sql = """
                SELECT
                    r.id as rest_id,
                    r.code as rest_code,
                    r.name as rest_name,
                    c.name as comp_name,
                    m.full_name as store_manager_name,
                    COUNT(f.id) as total_findings,
                    COUNT(CASE WHEN f.status = 'CLOSED' AND f.verified_at::date <= f.deadline_date THEN 1 END) as on_time_closed,
                    COUNT(CASE WHEN f.status = 'CLOSED' AND f.verified_at::date > f.deadline_date THEN 1 END) as overdue_closed,
                    COUNT(CASE WHEN f.status NOT IN ('CLOSED', 'DISMISSED') AND ? > f.deadline_date THEN 1 END) as overdue_open,
                    COUNT(CASE WHEN f.status NOT IN ('CLOSED', 'DISMISSED') AND ? <= f.deadline_date THEN 1 END) as in_progress
                FROM org_units r
                JOIN companies c ON r.company_id = c.id
                LEFT JOIN users m ON r.store_manager_user_id = m.id
                JOIN findings f ON f.restaurant_id = r.id
                WHERE f.created_at::date BETWEEN ? AND ?
                """ + extraWhere + """
                GROUP BY r.id, r.code, r.name, c.name, m.full_name
                ORDER BY overdue_open DESC, total_findings DESC
                """;

        List<RemediationStatusItem> items = jdbc.query(sql, (rs, rowNum) -> {
            long total = rs.getLong("total_findings");
            long onTime = rs.getLong("on_time_closed");
            double onTimeRate = total > 0 ? (onTime * 100.0 / total) : 100.0;
            return new RemediationStatusItem(
                    rs.getLong("rest_id"),
                    rs.getString("rest_code"),
                    rs.getString("rest_name"),
                    rs.getString("comp_name"),
                    rs.getString("store_manager_name"),
                    total,
                    onTime,
                    rs.getLong("overdue_closed"),
                    rs.getLong("overdue_open"),
                    rs.getLong("in_progress"),
                    Math.round(onTimeRate * 10.0) / 10.0
            );
        }, params.toArray());

        long sumTotal = 0, sumOnTime = 0, sumOverClosed = 0, sumOverOpen = 0, sumInProgress = 0;
        for (RemediationStatusItem it : items) {
            sumTotal += it.totalFindings();
            sumOnTime += it.resolvedOnTimeCount();
            sumOverClosed += it.resolvedOverdueCount();
            sumOverOpen += it.overdueOpenCount();
            sumInProgress += it.inProgressCount();
        }
        double totalOnTimeRate = sumTotal > 0 ? (sumOnTime * 100.0 / sumTotal) : 100.0;
        RemediationStatusItem summary = new RemediationStatusItem(
                0L, "—", "TỔNG CỘNG", "—", "—",
                sumTotal, sumOnTime, sumOverClosed, sumOverOpen, sumInProgress,
                Math.round(totalOnTimeRate * 10.0) / 10.0
        );

        return new RemediationStatusReportResponse(items, summary);
    }

    public byte[] exportRemediationStatusExcel(ReportFilter filter) {
        RemediationStatusReportResponse res = getRemediationStatus(filter);
        List<RemediationStatusItem> all = new ArrayList<>(res.items());
        all.add(res.summary());

        ExcelSheet<RemediationStatusItem> sheet = ExcelSheet.of("Tiến độ khắc phục", "BÁO CÁO TÌNH TRẠNG & TIẾN ĐỘ KHẮC PHỤC LỖI", all)
                .column("Mã nhà hàng", 14, RemediationStatusItem::restaurantCode)
                .column("Tên nhà hàng", 28, RemediationStatusItem::restaurantName)
                .column("Công ty", 22, RemediationStatusItem::companyName)
                .column("Cửa hàng trưởng", 20, RemediationStatusItem::storeManagerName)
                .column("Tổng lỗi", 12, RemediationStatusItem::totalFindings)
                .column("Đúng hạn (Đóng)", 15, RemediationStatusItem::resolvedOnTimeCount)
                .column("Quá hạn (Đóng)", 15, RemediationStatusItem::resolvedOverdueCount)
                .column("Quá hạn (Đang mở)", 17, RemediationStatusItem::overdueOpenCount)
                .column("Trong hạn (Đang làm)", 18, RemediationStatusItem::inProgressCount)
                .column("Tỷ lệ đúng hạn", 15, it -> it.onTimeRate() + "%");

        return ExcelWriter.export(List.of(sheet));
    }
}

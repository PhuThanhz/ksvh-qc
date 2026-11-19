package vn.ksvh.qc.report.service.query;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.report.dto.MonthlySummaryReportResponse;
import vn.ksvh.qc.report.dto.MonthlySummaryReportResponse.MonthlySummaryItem;
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
public class MonthlySummaryReportService {

    private final JdbcTemplate jdbc;
    private final Clock clock;

    public MonthlySummaryReportResponse getMonthlySummary(ReportFilter filter) {
        LocalDate today = BusinessDates.today(clock);
        LocalDate from = filter.safeFrom(today.minusMonths(5).withDayOfMonth(1));
        LocalDate to = filter.safeTo(today);

        List<Object> params = new ArrayList<>();
        params.add(Date.valueOf(from));
        params.add(Date.valueOf(to.plusDays(1)));

        StringBuilder extraWhere = new StringBuilder();
        if (filter.companyId() != null) {
            extraWhere.append(" AND r.company_id = ?");
            params.add(filter.companyId());
        }
        if (filter.restaurantId() != null) {
            extraWhere.append(" AND i.restaurant_id = ?");
            params.add(filter.restaurantId());
        }
        if (filter.inspectorId() != null) {
            extraWhere.append(" AND i.inspector_id = ?");
            params.add(filter.inspectorId());
        }

        String sql = """
                SELECT
                    to_char(coalesce(i.completed_at, i.submitted_at, i.created_at), 'YYYY-MM') as month_str,
                    COUNT(DISTINCT i.id) as total_inspections,
                    COUNT(DISTINCT CASE WHEN i.inspection_type = 'Định kỳ' OR i.inspection_type = 'PERIODIC' THEN i.id END) as periodic_count,
                    COUNT(DISTINCT CASE WHEN i.inspection_type <> 'Định kỳ' AND i.inspection_type <> 'PERIODIC' THEN i.id END) as adhoc_count,
                    COUNT(DISTINCT CASE WHEN i.status = 'COMPLETED' THEN i.id END) as completed_count,
                    COUNT(CASE WHEN it.result = 'PASS' THEN 1 END) as pass_items,
                    COUNT(CASE WHEN it.result = 'FAIL' THEN 1 END) as fail_items,
                    COUNT(DISTINCT f.id) as total_findings,
                    COUNT(DISTINCT CASE WHEN upper(f.risk_level_code) = 'M1' THEN f.id END) as m1_count,
                    COUNT(DISTINCT CASE WHEN upper(f.risk_level_code) = 'M2' THEN f.id END) as m2_count,
                    COUNT(DISTINCT CASE WHEN upper(f.risk_level_code) = 'M3' THEN f.id END) as m3_count,
                    COUNT(DISTINCT CASE WHEN upper(f.risk_level_code) = 'M4' THEN f.id END) as m4_count
                FROM inspections i
                JOIN org_units r ON i.restaurant_id = r.id
                LEFT JOIN inspection_items it ON it.inspection_id = i.id
                LEFT JOIN findings f ON f.inspection_id = i.id
                WHERE i.created_at >= ?::timestamp AND i.created_at < ?::timestamp
                """ + extraWhere + """
                GROUP BY to_char(coalesce(i.completed_at, i.submitted_at, i.created_at), 'YYYY-MM')
                ORDER BY month_str ASC
                """;

        List<MonthlySummaryItem> items = jdbc.query(sql, (rs, rowNum) -> {
            long pass = rs.getLong("pass_items");
            long fail = rs.getLong("fail_items");
            long rated = pass + fail;
            double compliance = rated > 0 ? (pass * 100.0 / rated) : 100.0;
            return new MonthlySummaryItem(
                    rs.getString("month_str"),
                    rs.getLong("total_inspections"),
                    rs.getLong("periodic_count"),
                    rs.getLong("adhoc_count"),
                    rs.getLong("completed_count"),
                    Math.round(compliance * 10.0) / 10.0,
                    rs.getLong("total_findings"),
                    rs.getLong("m1_count"),
                    rs.getLong("m2_count"),
                    rs.getLong("m3_count"),
                    rs.getLong("m4_count")
            );
        }, params.toArray());

        long sumTotalIns = 0, sumPeriodic = 0, sumAdhoc = 0, sumCompleted = 0, sumFindings = 0;
        long sumM1 = 0, sumM2 = 0, sumM3 = 0, sumM4 = 0;
        double sumCompliance = 0;

        for (MonthlySummaryItem it : items) {
            sumTotalIns += it.totalInspections();
            sumPeriodic += it.periodicCount();
            sumAdhoc += it.adHocCount();
            sumCompleted += it.completedCount();
            sumFindings += it.totalFindings();
            sumM1 += it.m1Count();
            sumM2 += it.m2Count();
            sumM3 += it.m3Count();
            sumM4 += it.m4Count();
            sumCompliance += it.complianceRate();
        }

        double avgCompliance = !items.isEmpty() ? (sumCompliance / items.size()) : 100.0;
        MonthlySummaryItem summary = new MonthlySummaryItem(
                "TỔNG CỘNG", sumTotalIns, sumPeriodic, sumAdhoc, sumCompleted,
                Math.round(avgCompliance * 10.0) / 10.0,
                sumFindings, sumM1, sumM2, sumM3, sumM4
        );

        return new MonthlySummaryReportResponse(items, summary);
    }

    public byte[] exportMonthlySummaryExcel(ReportFilter filter) {
        MonthlySummaryReportResponse res = getMonthlySummary(filter);
        List<MonthlySummaryItem> all = new ArrayList<>(res.items());
        all.add(res.summary());

        ExcelSheet<MonthlySummaryItem> sheet = ExcelSheet.of("Tổng hợp tháng", "BÁO CÁO TỔNG HỢP PHIẾU CHẤM THEO THÁNG", all)
                .column("Tháng", 15, MonthlySummaryItem::month)
                .column("Tổng số phiếu", 14, MonthlySummaryItem::totalInspections)
                .column("Phiếu định kỳ", 14, MonthlySummaryItem::periodicCount)
                .column("Phiếu đột xuất", 14, MonthlySummaryItem::adHocCount)
                .column("Đã hoàn thành", 14, MonthlySummaryItem::completedCount)
                .column("% Tuân thủ", 14, it -> it.complianceRate() + "%")
                .column("Tổng lỗi", 12, MonthlySummaryItem::totalFindings)
                .column("Lỗi M1", 10, MonthlySummaryItem::m1Count)
                .column("Lỗi M2", 10, MonthlySummaryItem::m2Count)
                .column("Lỗi M3", 10, MonthlySummaryItem::m3Count)
                .column("Lỗi M4", 10, MonthlySummaryItem::m4Count);

        return ExcelWriter.export(List.of(sheet));
    }
}

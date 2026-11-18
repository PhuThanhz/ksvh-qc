package vn.ksvh.qc.report.service.query;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.report.dto.CriteriaViolationReportResponse;
import vn.ksvh.qc.report.dto.CriteriaViolationReportResponse.CriteriaViolationItem;
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
public class CriteriaViolationReportService {

    private final JdbcTemplate jdbc;
    private final Clock clock;

    public CriteriaViolationReportResponse getCriteriaViolations(ReportFilter filter) {
        LocalDate today = BusinessDates.today(clock);
        LocalDate from = filter.safeFrom(today.minusMonths(6).withDayOfMonth(1));
        LocalDate to = filter.safeTo(today);

        List<Object> params = new ArrayList<>();
        params.add(Date.valueOf(from));
        params.add(Date.valueOf(to));

        StringBuilder extraWhere = new StringBuilder();
        if (filter.groupId() != null) {
            extraWhere.append(" AND c.group_id = ?");
            params.add(filter.groupId());
        }
        if (filter.companyId() != null) {
            extraWhere.append(" AND r.company_id = ?");
            params.add(filter.companyId());
        }

        String sql = """
                SELECT
                    c.id as crit_id,
                    c.code as crit_code,
                    c.name as crit_name,
                    cg.name as group_name,
                    c.base_impact,
                    COUNT(f.id) as violation_count,
                    COUNT(DISTINCT f.restaurant_id) as rest_count,
                    COUNT(CASE WHEN f.violation_count > 1 THEN 1 END) as repeat_count,
                    COUNT(CASE WHEN f.status NOT IN ('CLOSED', 'DISMISSED') THEN 1 END) as open_count,
                    COUNT(CASE WHEN f.status = 'CLOSED' THEN 1 END) as closed_count
                FROM criteria c
                JOIN criterion_groups cg ON c.group_id = cg.id
                JOIN findings f ON f.criterion_id = c.id
                JOIN org_units r ON f.restaurant_id = r.id
                WHERE f.created_at::date BETWEEN ? AND ?
                """ + extraWhere + """
                GROUP BY c.id, c.code, c.name, cg.name, c.base_impact
                ORDER BY violation_count DESC, repeat_count DESC
                """;

        List<CriteriaViolationItem> raw = jdbc.query(sql, (rs, rowNum) -> new CriteriaViolationItem(
                rs.getLong("crit_id"),
                rs.getString("crit_code"),
                rs.getString("crit_name"),
                rs.getString("group_name"),
                rs.getShort("base_impact"),
                rs.getLong("violation_count"),
                rs.getLong("rest_count"),
                rs.getLong("repeat_count"),
                rs.getLong("open_count"),
                rs.getLong("closed_count"),
                0.0
        ), params.toArray());

        long totalViolations = raw.stream().mapToLong(CriteriaViolationItem::violationCount).sum();

        List<CriteriaViolationItem> items = new ArrayList<>();
        long cumulative = 0;
        for (CriteriaViolationItem it : raw) {
            cumulative += it.violationCount();
            double pareto = totalViolations > 0 ? (cumulative * 100.0 / totalViolations) : 0.0;
            items.add(new CriteriaViolationItem(
                    it.criterionId(), it.criterionCode(), it.criterionName(), it.groupName(),
                    it.baseImpact(), it.violationCount(), it.restaurantCount(), it.repeatCount(),
                    it.openCount(), it.closedCount(), Math.round(pareto * 10.0) / 10.0
            ));
        }

        return new CriteriaViolationReportResponse(items, totalViolations);
    }

    public byte[] exportCriteriaViolationsExcel(ReportFilter filter) {
        CriteriaViolationReportResponse res = getCriteriaViolations(filter);
        ExcelSheet<CriteriaViolationItem> sheet = ExcelSheet.of("Lỗi theo tiêu chí", "BÁO CÁO PHÂN TÍCH LỖI VI PHẠM THEO TIÊU CHÍ (PARETO)", res.items())
                .column("Mã tiêu chí", 14, CriteriaViolationItem::criterionCode)
                .column("Tên tiêu chí", 32, CriteriaViolationItem::criterionName)
                .column("Nhóm tiêu chí", 22, CriteriaViolationItem::groupName)
                .column("Mức gốc", 10, CriteriaViolationItem::baseImpact)
                .column("Số lần vi phạm", 14, CriteriaViolationItem::violationCount)
                .column("Số NH vi phạm", 14, CriteriaViolationItem::restaurantCount)
                .column("Lần tái phạm", 12, CriteriaViolationItem::repeatCount)
                .column("Đang mở", 10, CriteriaViolationItem::openCount)
                .column("Đã khắc phục", 12, CriteriaViolationItem::closedCount)
                .column("% Luỹ kế (Pareto)", 16, it -> it.paretoPercentage() + "%");

        return ExcelWriter.export(List.of(sheet));
    }
}

package vn.ksvh.qc.report.service.query;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.report.dto.InspectorProductivityReportResponse;
import vn.ksvh.qc.report.dto.InspectorProductivityReportResponse.InspectorProductivityItem;
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
public class InspectorProductivityReportService {

    private final JdbcTemplate jdbc;
    private final Clock clock;

    public InspectorProductivityReportResponse getInspectorProductivity(ReportFilter filter) {
        LocalDate today = BusinessDates.today(clock);
        LocalDate from = filter.safeFrom(today.minusMonths(3).withDayOfMonth(1));
        LocalDate to = filter.safeTo(today);

        List<Object> params = new ArrayList<>();
        params.add(Date.valueOf(from));
        params.add(Date.valueOf(to.plusDays(1)));

        StringBuilder extraWhere = new StringBuilder();
        if (filter.inspectorId() != null) {
            extraWhere.append(" AND u.id = ?");
            params.add(filter.inspectorId());
        }

        String sql = """
                SELECT
                    u.id as inspector_id,
                    u.username as inspector_username,
                    u.full_name as inspector_name,
                    COUNT(DISTINCT i.id) as total_assigned,
                    COUNT(DISTINCT CASE WHEN i.status = 'COMPLETED' THEN i.id END) as completed_count,
                    COALESCE(AVG(EXTRACT(EPOCH FROM (coalesce(i.submitted_at, i.completed_at) - coalesce(i.checkin_at, i.created_at))) / 60.0), 0) as avg_duration_min,
                    COUNT(DISTINCT f.id) as total_findings,
                    COUNT(DISTINCT CASE WHEN upper(f.risk_level_code) IN ('M3', 'M4') THEN f.id END) as m3m4_count
                FROM users u
                JOIN user_roles ur ON ur.user_id = u.id
                JOIN roles ro ON ur.role_id = ro.id
                LEFT JOIN inspections i ON i.inspector_id = u.id AND i.created_at >= ?::timestamp AND i.created_at < ?::timestamp
                LEFT JOIN findings f ON f.inspection_id = i.id
                WHERE ro.code = 'KSVH_INSPECTOR' AND u.active = true
                """ + extraWhere + """
                GROUP BY u.id, u.username, u.full_name
                ORDER BY completed_count DESC, total_findings DESC
                """;

        List<InspectorProductivityItem> items = jdbc.query(sql, (rs, rowNum) -> {
            long completed = rs.getLong("completed_count");
            long findings = rs.getLong("total_findings");
            double avgPerIns = completed > 0 ? (findings * 1.0 / completed) : 0.0;
            double avgMin = rs.getDouble("avg_duration_min");
            return new InspectorProductivityItem(
                    rs.getLong("inspector_id"),
                    rs.getString("inspector_username"),
                    rs.getString("inspector_name"),
                    rs.getLong("total_assigned"),
                    completed,
                    Math.round(avgMin * 10.0) / 10.0,
                    findings,
                    rs.getLong("m3m4_count"),
                    Math.round(avgPerIns * 10.0) / 10.0
            );
        }, params.toArray());

        return new InspectorProductivityReportResponse(items);
    }

    public byte[] exportInspectorProductivityExcel(ReportFilter filter) {
        InspectorProductivityReportResponse res = getInspectorProductivity(filter);
        ExcelSheet<InspectorProductivityItem> sheet = ExcelSheet.of("Năng suất chuyên viên", "BÁO CÁO NĂNG SUẤT CHUYÊN VIÊN KIỂM SOÁT VẬN HÀNH", res.items())
                .column("Tài khoản", 14, InspectorProductivityItem::inspectorUsername)
                .column("Họ và tên", 24, InspectorProductivityItem::inspectorFullName)
                .column("Phiếu được giao", 16, InspectorProductivityItem::totalAssigned)
                .column("Đã hoàn thành", 15, InspectorProductivityItem::completedInspections)
                .column("Thời gian chấm TB (phút)", 24, InspectorProductivityItem::avgDurationMinutes)
                .column("Tổng lỗi phát hiện", 18, InspectorProductivityItem::totalFindingsFound)
                .column("Lỗi M3/M4", 12, InspectorProductivityItem::m3m4Count)
                .column("TB lỗi / phiếu", 15, InspectorProductivityItem::avgFindingsPerInspection);

        return ExcelWriter.export(List.of(sheet));
    }
}

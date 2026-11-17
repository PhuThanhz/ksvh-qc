package vn.ksvh.qc.report.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.report.dto.*;
import vn.ksvh.qc.report.dto.CriteriaViolationReportResponse.CriteriaViolationItem;
import vn.ksvh.qc.report.dto.InspectorProductivityReportResponse.InspectorProductivityItem;
import vn.ksvh.qc.report.dto.MonthlySummaryReportResponse.MonthlySummaryItem;
import vn.ksvh.qc.report.dto.RemediationStatusReportResponse.RemediationStatusItem;
import vn.ksvh.qc.report.dto.RestaurantRankingReportResponse.RestaurantRankingItem;
import vn.ksvh.qc.shared.excel.ExcelSheet;
import vn.ksvh.qc.shared.excel.ExcelWriter;
import vn.ksvh.qc.shared.util.BusinessDates;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final JdbcTemplate jdbc;
    private final Clock clock;

    public MonthlySummaryReportResponse getMonthlySummary(ReportFilter filter) {
        LocalDate today = BusinessDates.today(clock);
        LocalDate from = filter.safeFrom(today.minusMonths(5).withDayOfMonth(1));
        LocalDate to = filter.safeTo(today);

        List<Object> params = new ArrayList<>();
        params.add(Date.valueOf(from));
        params.add(Date.valueOf(to));

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
                WHERE i.created_at::date BETWEEN ? AND ?
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

    public RestaurantRankingReportResponse getRestaurantRankings(ReportFilter filter) {
        LocalDate today = BusinessDates.today(clock);
        LocalDate from = filter.safeFrom(today.minusMonths(3).withDayOfMonth(1));
        LocalDate to = filter.safeTo(today);

        List<Object> params = new ArrayList<>();
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
                    COUNT(DISTINCT i.id) as inspection_count,
                    COALESCE(AVG(f.calculated_score), 0) as avg_score,
                    COUNT(CASE WHEN it.result = 'PASS' THEN 1 END) as pass_items,
                    COUNT(CASE WHEN it.result = 'FAIL' THEN 1 END) as fail_items,
                    COUNT(DISTINCT CASE WHEN f.status NOT IN ('CLOSED', 'DISMISSED') THEN f.id END) as open_findings,
                    COUNT(DISTINCT CASE WHEN upper(f.risk_level_code) = 'M1' AND f.status NOT IN ('CLOSED', 'DISMISSED') THEN f.id END) as m1_count,
                    COUNT(DISTINCT CASE WHEN upper(f.risk_level_code) = 'M2' AND f.status NOT IN ('CLOSED', 'DISMISSED') THEN f.id END) as m2_count,
                    COUNT(DISTINCT CASE WHEN upper(f.risk_level_code) = 'M3' AND f.status NOT IN ('CLOSED', 'DISMISSED') THEN f.id END) as m3_count,
                    COUNT(DISTINCT CASE WHEN upper(f.risk_level_code) = 'M4' AND f.status NOT IN ('CLOSED', 'DISMISSED') THEN f.id END) as m4_count
                FROM org_units r
                JOIN companies c ON r.company_id = c.id
                LEFT JOIN users m ON r.store_manager_user_id = m.id
                LEFT JOIN inspections i ON i.restaurant_id = r.id AND i.created_at::date BETWEEN ? AND ?
                LEFT JOIN inspection_items it ON it.inspection_id = i.id
                LEFT JOIN findings f ON f.restaurant_id = r.id AND f.created_at::date BETWEEN ? AND ?
                WHERE r.unit_type = 'RESTAURANT' AND r.active = true
                """ + extraWhere + """
                GROUP BY r.id, r.code, r.name, c.name, m.full_name
                ORDER BY m4_count DESC, avg_score DESC, pass_items ASC
                """;

        // Insert duplicate params for findings sub-clause
        params.add(2, Date.valueOf(from));
        params.add(3, Date.valueOf(to));

        List<RestaurantRankingItem> items = jdbc.query(sql, (rs, rowNum) -> {
            long pass = rs.getLong("pass_items");
            long fail = rs.getLong("fail_items");
            long rated = pass + fail;
            double compliance = rated > 0 ? (pass * 100.0 / rated) : 100.0;
            double avgScore = rs.getDouble("avg_score");
            long m3 = rs.getLong("m3_count");
            long m4 = rs.getLong("m4_count");

            String rankCategory;
            if (m4 > 0 || compliance < 60.0) {
                rankCategory = "Nguy cơ cao";
            } else if (m3 > 0 || compliance < 75.0) {
                rankCategory = "Cần lưu ý";
            } else if (compliance >= 90.0) {
                rankCategory = "Tốt";
            } else {
                rankCategory = "Đạt";
            }

            return new RestaurantRankingItem(
                    rs.getLong("rest_id"),
                    rs.getString("rest_code"),
                    rs.getString("rest_name"),
                    rs.getString("comp_name"),
                    rs.getString("store_manager_name"),
                    rs.getLong("inspection_count"),
                    Math.round(avgScore * 10.0) / 10.0,
                    Math.round(compliance * 10.0) / 10.0,
                    rs.getLong("open_findings"),
                    rs.getLong("m1_count"),
                    rs.getLong("m2_count"),
                    m3,
                    m4,
                    rankCategory
            );
        }, params.toArray());

        return new RestaurantRankingReportResponse(items);
    }

    public byte[] exportRestaurantRankingsExcel(ReportFilter filter) {
        RestaurantRankingReportResponse res = getRestaurantRankings(filter);
        ExcelSheet<RestaurantRankingItem> sheet = ExcelSheet.of("Xếp hạng nhà hàng", "BÁO CÁO XẾP HẠNG RỦI RO & TUÂN THỦ NHÀ HÀNG", res.items())
                .column("Mã nhà hàng", 14, RestaurantRankingItem::restaurantCode)
                .column("Tên nhà hàng", 28, RestaurantRankingItem::restaurantName)
                .column("Công ty", 22, RestaurantRankingItem::companyName)
                .column("Cửa hàng trưởng", 20, RestaurantRankingItem::storeManagerName)
                .column("Số lượt chấm", 13, RestaurantRankingItem::inspectionCount)
                .column("% Tuân thủ", 13, it -> it.complianceRate() + "%")
                .column("Điểm rủi ro TB", 14, RestaurantRankingItem::averageScore)
                .column("Lỗi đang mở", 13, RestaurantRankingItem::openFindingsCount)
                .column("M1", 8, RestaurantRankingItem::m1Count)
                .column("M2", 8, RestaurantRankingItem::m2Count)
                .column("M3", 8, RestaurantRankingItem::m3Count)
                .column("M4", 8, RestaurantRankingItem::m4Count)
                .column("Xếp loại", 14, RestaurantRankingItem::rankCategory);

        return ExcelWriter.export(List.of(sheet));
    }

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

    public InspectorProductivityReportResponse getInspectorProductivity(ReportFilter filter) {
        LocalDate today = BusinessDates.today(clock);
        LocalDate from = filter.safeFrom(today.minusMonths(3).withDayOfMonth(1));
        LocalDate to = filter.safeTo(today);

        List<Object> params = new ArrayList<>();
        params.add(Date.valueOf(from));
        params.add(Date.valueOf(to));

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
                LEFT JOIN inspections i ON i.inspector_id = u.id AND i.created_at::date BETWEEN ? AND ?
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

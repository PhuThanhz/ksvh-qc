package vn.ksvh.qc.report.service.query;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.report.dto.ReportFilter;
import vn.ksvh.qc.report.dto.RestaurantRankingReportResponse;
import vn.ksvh.qc.report.dto.RestaurantRankingReportResponse.RestaurantRankingItem;
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
public class RestaurantRankingReportService {

    private final JdbcTemplate jdbc;
    private final Clock clock;

    public RestaurantRankingReportResponse getRestaurantRankings(ReportFilter filter) {
        LocalDate today = BusinessDates.today(clock);
        LocalDate from = filter.safeFrom(today.minusMonths(3).withDayOfMonth(1));
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
                LEFT JOIN inspections i ON i.restaurant_id = r.id AND i.created_at >= ?::timestamp AND i.created_at < ?::timestamp
                LEFT JOIN inspection_items it ON it.inspection_id = i.id
                LEFT JOIN findings f ON f.restaurant_id = r.id AND f.created_at >= ?::timestamp AND f.created_at < ?::timestamp
                WHERE r.unit_type = 'RESTAURANT' AND r.active = true
                """ + extraWhere + """
                GROUP BY r.id, r.code, r.name, c.name, m.full_name
                ORDER BY m4_count DESC, avg_score DESC, pass_items ASC
                """;

        // Insert duplicate params for findings sub-clause
        params.add(2, Date.valueOf(from));
        params.add(3, Date.valueOf(to.plusDays(1)));

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
}

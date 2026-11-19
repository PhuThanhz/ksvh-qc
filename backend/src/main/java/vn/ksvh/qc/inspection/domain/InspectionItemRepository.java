package vn.ksvh.qc.inspection.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface InspectionItemRepository extends JpaRepository<InspectionItem, Long> {
    List<InspectionItem> findByInspectionIdOrderBySortOrderAsc(Long inspectionId);

    /** Tổng hợp số lượng và trọng số tiêu chí theo kết quả cho nhiều phiếu chấm trong 1 query, tránh tải toàn bộ InspectionItem entity khi hiển thị danh sách. */
    @Query("""
            select ii.inspection.id,
                   count(ii),
                   sum(case when ii.result = vn.ksvh.qc.inspection.domain.ItemResult.PASS then 1 else 0 end),
                   sum(case when ii.result = vn.ksvh.qc.inspection.domain.ItemResult.FAIL then 1 else 0 end),
                   sum(case when ii.result = vn.ksvh.qc.inspection.domain.ItemResult.NA then 1 else 0 end),
                   sum(case when ii.result = vn.ksvh.qc.inspection.domain.ItemResult.PASS then ii.baseImpact else 0 end),
                   sum(case when ii.result = vn.ksvh.qc.inspection.domain.ItemResult.FAIL then ii.baseImpact else 0 end)
            from InspectionItem ii
            where ii.inspection.id in :inspectionIds
            group by ii.inspection.id
            """)
    List<Object[]> summarizeByInspectionIds(@Param("inspectionIds") Collection<Long> inspectionIds);
}

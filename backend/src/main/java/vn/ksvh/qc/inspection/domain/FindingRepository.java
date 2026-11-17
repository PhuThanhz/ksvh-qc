package vn.ksvh.qc.inspection.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface FindingRepository extends JpaRepository<Finding, Long>, JpaSpecificationExecutor<Finding> {
    List<Finding> findByInspectionId(Long inspectionId);
    List<Finding> findByRestaurantId(Long restaurantId);
    List<Finding> findByRestaurantIdAndStatus(Long restaurantId, FindingStatus status);

    /** Tổng hợp điểm rủi ro và mức rủi ro cao nhất cho nhiều phiếu trong 1 query duy nhất.
     * Chỉ tính các lỗi hợp lệ (loại trừ các lỗi đã DISMISSED do khiếu nại thành công). */
    @Query("select f.inspectionId, coalesce(sum(f.calculatedScore), 0), max(f.riskLevelCode) " +
           "from Finding f where f.status <> 'DISMISSED' and f.inspectionId in :inspectionIds group by f.inspectionId")
    List<Object[]> findRiskSummariesByInspectionIds(@Param("inspectionIds") Collection<Long> inspectionIds);
}

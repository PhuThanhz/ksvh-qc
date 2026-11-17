package vn.ksvh.qc.inspection.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.time.LocalDate;
import java.util.List;

public interface FindingRepository extends JpaRepository<Finding, Long>, JpaSpecificationExecutor<Finding> {
    List<Finding> findByInspectionId(Long inspectionId);

    /** Lỗi còn phải khắc phục mà hạn đã qua (dùng cho job quá hạn). */
    List<Finding> findByStatusInAndDeadlineDateBefore(Collection<FindingStatus> statuses, LocalDate date);

    /** Lỗi sắp đến hạn vào đúng ngày (dùng cho job nhắc trước 1 ngày). */
    List<Finding> findByStatusInAndDeadlineDate(Collection<FindingStatus> statuses, LocalDate deadlineDate);
    List<Finding> findByRestaurantId(Long restaurantId);
    List<Finding> findByRestaurantIdAndStatus(Long restaurantId, FindingStatus status);
    List<Finding> findByRestaurantIdAndStatusIn(Long restaurantId, Collection<FindingStatus> statuses);
    List<Finding> findByRestaurantIdInAndStatusIn(Collection<Long> restaurantIds, Collection<FindingStatus> statuses);
    List<Finding> findByStatusIn(Collection<FindingStatus> statuses);

    /** Tổng hợp điểm rủi ro và mức rủi ro cao nhất cho nhiều phiếu trong 1 query duy nhất.
     * Chỉ tính các lỗi hợp lệ (loại trừ các lỗi đã DISMISSED do khiếu nại thành công). */
    @Query("select f.inspectionId, coalesce(sum(f.calculatedScore), 0), max(f.riskLevelCode) " +
           "from Finding f where f.status <> 'DISMISSED' and f.inspectionId in :inspectionIds group by f.inspectionId")
    List<Object[]> findRiskSummariesByInspectionIds(@Param("inspectionIds") Collection<Long> inspectionIds);
}

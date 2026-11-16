package vn.ksvh.qc.inspection.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface FindingRepository extends JpaRepository<Finding, Long>, JpaSpecificationExecutor<Finding> {
    List<Finding> findByInspectionId(Long inspectionId);
    List<Finding> findByRestaurantId(Long restaurantId);
    List<Finding> findByRestaurantIdAndStatus(Long restaurantId, FindingStatus status);
}

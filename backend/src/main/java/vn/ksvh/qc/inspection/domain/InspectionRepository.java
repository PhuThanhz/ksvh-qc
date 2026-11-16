package vn.ksvh.qc.inspection.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InspectionRepository extends JpaRepository<Inspection, Long>, JpaSpecificationExecutor<Inspection> {
    boolean existsByCodeIgnoreCase(String code);
    List<Inspection> findByInspectorIdAndStatusIn(Long inspectorId, List<InspectionStatus> statuses);
    List<Inspection> findByRestaurantId(Long restaurantId);

    @Query("select i.id from Inspection i where i.inspectorId = :inspectorId")
    List<Long> findIdsByInspectorId(@Param("inspectorId") Long inspectorId);
}

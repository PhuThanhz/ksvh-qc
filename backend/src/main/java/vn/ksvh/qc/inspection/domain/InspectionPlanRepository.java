package vn.ksvh.qc.inspection.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface InspectionPlanRepository extends JpaRepository<InspectionPlan, Long>, JpaSpecificationExecutor<InspectionPlan> {
    boolean existsByPlanCodeIgnoreCase(String planCode);

    long countByPlanCodeStartingWithIgnoreCase(String prefix);
    boolean existsByPlanCodeIgnoreCaseAndIdNot(String planCode, Long id);
}

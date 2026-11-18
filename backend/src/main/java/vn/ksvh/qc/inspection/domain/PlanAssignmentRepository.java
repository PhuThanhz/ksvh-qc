package vn.ksvh.qc.inspection.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface PlanAssignmentRepository extends JpaRepository<PlanAssignment, Long> {

    List<PlanAssignment> findByPlanIdOrderBySortOrderAscIdAsc(Long planId);

    List<PlanAssignment> findByPlanIdIn(Collection<Long> planIds);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from PlanAssignment a where a.planId = :planId")
    void deleteByPlanId(Long planId);
}

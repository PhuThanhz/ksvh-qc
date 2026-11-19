package vn.ksvh.qc.inspection.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface PlanAssignmentRepository extends JpaRepository<PlanAssignment, Long> {

    List<PlanAssignment> findByPlanIdOrderBySortOrderAscIdAsc(Long planId);

    default List<PlanAssignment> findByPlanId(Long planId) {
        return findByPlanIdOrderBySortOrderAscIdAsc(planId);
    }

    List<PlanAssignment> findByPlanIdIn(Collection<Long> planIds);

    @Query("select a.planId, count(a) from PlanAssignment a where a.planId in :planIds group by a.planId")
    List<Object[]> countByPlanIdIn(Collection<Long> planIds);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from PlanAssignment a where a.planId = :planId")
    void deleteByPlanId(Long planId);
}

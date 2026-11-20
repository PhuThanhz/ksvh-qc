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

    /** Dòng phân công trong khoảng ngày của các kế hoạch chưa bị từ chối (trừ một kế hoạch, vd kế hoạch đang sửa). */
    @Query("""
            select a from PlanAssignment a, InspectionPlan p
            where p.id = a.planId
              and p.status <> vn.ksvh.qc.inspection.domain.PlanStatus.REJECTED
              and a.scheduledDate between :from and :to
              and (:excludePlanId is null or p.id <> :excludePlanId)
            order by a.scheduledDate, a.inspectorId
            """)
    List<PlanAssignment> findScheduled(java.time.LocalDate from, java.time.LocalDate to, Long excludePlanId);

    @Query("select a.planId, count(a) from PlanAssignment a where a.planId in :planIds group by a.planId")
    List<Object[]> countByPlanIdIn(Collection<Long> planIds);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from PlanAssignment a where a.planId = :planId")
    void deleteByPlanId(Long planId);
}

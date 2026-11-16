package vn.ksvh.qc.criteria.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CriterionGroupRepository extends JpaRepository<CriterionGroup, Long> {

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    List<CriterionGroup> findAllByOrderBySortOrderAscIdAsc();

    /** Số tiêu chí theo nhóm: mỗi phần tử [groupId, count]. */
    @Query("select c.group.id, count(c) from Criterion c group by c.group.id")
    List<Object[]> countCriteriaByGroup();

    Optional<CriterionGroup> findByCodeIgnoreCase(String code);
}

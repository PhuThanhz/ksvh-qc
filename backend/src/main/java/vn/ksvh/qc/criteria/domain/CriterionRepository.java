package vn.ksvh.qc.criteria.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CriterionRepository extends JpaRepository<Criterion, Long>, JpaSpecificationExecutor<Criterion> {

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    @Override
    @EntityGraph(attributePaths = "group")
    Page<Criterion> findAll(Specification<Criterion> spec, Pageable pageable);

    @EntityGraph(attributePaths = "group")
    Optional<Criterion> findWithGroupById(Long id);

    @EntityGraph(attributePaths = "group")
    List<Criterion> findByIdIn(Collection<Long> ids);

    /** Tiêu chí đang hoạt động, theo thứ tự nhóm rồi thứ tự tiêu chí (dùng chọn vào mẫu phiếu). */
    @Query("""
            select c from Criterion c join fetch c.group g
            where c.active = true and g.active = true
            order by g.sortOrder, g.id, c.sortOrder, c.id
            """)
    List<Criterion> findActiveOrdered();

    @EntityGraph(attributePaths = "group")
    Optional<Criterion> findByCodeIgnoreCase(String code);

    @EntityGraph(attributePaths = "group")
    List<Criterion> findAllByOrderByCodeAsc();
}

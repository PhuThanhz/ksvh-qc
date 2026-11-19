package vn.ksvh.qc.organization.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrgUnitRepository extends JpaRepository<OrgUnit, Long>, JpaSpecificationExecutor<OrgUnit> {

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    long countByCompanyId(Long companyId);

    @Override
    @EntityGraph(attributePaths = "company")
    Page<OrgUnit> findAll(Specification<OrgUnit> spec, Pageable pageable);

    @EntityGraph(attributePaths = "company")
    Optional<OrgUnit> findWithCompanyById(Long id);

    /** Id các nhà hàng mà user là Cửa hàng trưởng hoặc OBM. */
    @Query("select u.id from OrgUnit u where u.storeManagerUserId = :userId or u.obmUserId = :userId")
    List<Long> findIdsManagedBy(@Param("userId") Long userId);

    @EntityGraph(attributePaths = "company")
    Optional<OrgUnit> findByCodeIgnoreCase(String code);

    /** Nhà hàng mà user đang là Cửa hàng trưởng. */
    List<OrgUnit> findByStoreManagerUserIdOrderByCodeAsc(Long userId);

    /** Nhà hàng mà user đang là OBM. */
    List<OrgUnit> findByObmUserIdOrderByCodeAsc(Long userId);
}

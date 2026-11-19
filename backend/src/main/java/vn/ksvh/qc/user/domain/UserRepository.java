package vn.ksvh.qc.user.domain;

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

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    @Override
    @EntityGraph(attributePaths = "roles")
    Page<User> findAll(Specification<User> spec, Pageable pageable);

    @EntityGraph(attributePaths = "roles")
    List<User> findWithRolesByIdIn(Collection<Long> ids);

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByUsernameIgnoreCase(String username);

    /** Số tài khoản đang hoạt động có vai trò roleCode. */
    @Query("select count(distinct u) from User u join u.roles r where u.active = true and r.code = :roleCode")
    long countActiveWithRole(String roleCode);

    @EntityGraph(attributePaths = "roles")
    @Query("select distinct u from User u join u.roles r where u.active = true and r.code in :roleCodes")
    java.util.List<User> findActiveWithRoleIn(@org.springframework.data.repository.query.Param("roleCodes") java.util.Collection<String> roleCodes);
}

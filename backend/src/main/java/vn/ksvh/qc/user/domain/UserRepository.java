package vn.ksvh.qc.user.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByUsernameIgnoreCase(String username);

    /** Số tài khoản đang hoạt động có vai trò roleCode. */
    @Query("select count(distinct u) from User u join u.roles r where u.active = true and r.code = :roleCode")
    long countActiveWithRole(String roleCode);

    @Query("select distinct u from User u join u.roles r where u.active = true and r.code in :roleCodes")
    java.util.List<User> findActiveWithRoleIn(@org.springframework.data.repository.query.Param("roleCodes") java.util.Collection<String> roleCodes);
}

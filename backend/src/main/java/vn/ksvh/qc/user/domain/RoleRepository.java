package vn.ksvh.qc.user.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByCode(String code);

    List<Role> findByCodeIn(Collection<String> codes);

    boolean existsByCodeIgnoreCase(String code);

    /** Số người dùng theo từng vai trò: mỗi phần tử [roleId, count]. */
    @Query("select r.id, count(u) from User u join u.roles r group by r.id")
    List<Object[]> countUsersByRole();

    @Query("select count(u) from User u join u.roles r where r.id = :roleId")
    long countUsers(Long roleId);
}

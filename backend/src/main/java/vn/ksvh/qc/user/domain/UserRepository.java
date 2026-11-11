package vn.ksvh.qc.user.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    /** keyword đã được chuẩn hoá chữ thường, không null. */
    @Query("""
            select u from User u
            where lower(u.username) like concat('%', :keyword, '%')
               or lower(u.fullName) like concat('%', :keyword, '%')
            """)
    Page<User> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
}

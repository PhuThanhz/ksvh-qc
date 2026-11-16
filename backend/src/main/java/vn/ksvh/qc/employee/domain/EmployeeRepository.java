package vn.ksvh.qc.employee.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

    boolean existsByEmployeeCodeIgnoreCase(String code);

    boolean existsByEmployeeCodeIgnoreCaseAndIdNot(String code, Long id);

    boolean existsByUserId(Long userId);

    boolean existsByUserIdAndIdNot(Long userId, Long id);

    Optional<Employee> findByEmployeeCodeIgnoreCase(String code);
}

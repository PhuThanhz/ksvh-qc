package vn.ksvh.qc.employee.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.employee.api.EmployeeContactInfo;
import vn.ksvh.qc.employee.api.EmployeeLookupApi;
import vn.ksvh.qc.employee.domain.Employee;
import vn.ksvh.qc.employee.domain.EmployeeRepository;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeLookupService implements EmployeeLookupApi {

    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<EmployeeContactInfo> findContactByUserId(Long userId) {
        if (userId == null) {
            return Optional.empty();
        }
        return employeeRepository.findByUserId(userId).map(this::toInfo);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, EmployeeContactInfo> findContactsByUserIds(Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return employeeRepository.findByUserIdIn(userIds).stream()
                .filter(e -> e.getUserId() != null)
                .collect(Collectors.toMap(Employee::getUserId, this::toInfo, (a, b) -> a));
    }

    private EmployeeContactInfo toInfo(Employee e) {
        return new EmployeeContactInfo(
                e.getUserId(),
                e.getEmployeeCode(),
                e.getFullName(),
                e.getEmail(),
                e.getPhone()
        );
    }
}

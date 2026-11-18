package vn.ksvh.qc.employee.api;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;

/** Tra cứu thông tin nhân viên cho các module khác. Không lộ entity ra ngoài module employee. */
public interface EmployeeLookupApi {

    Optional<EmployeeContactInfo> findContactByUserId(Long userId);

    Map<Long, EmployeeContactInfo> findContactsByUserIds(Collection<Long> userIds);
}

package vn.ksvh.qc.user.api;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;

/** Tra cứu tài khoản cho module auth. Không lộ entity ra ngoài module user. */
public interface UserAccountApi {

    Optional<UserAccount> findByUsername(String username);

    Optional<UserAccount> findById(Long id);

    /** Tra nhiều người dùng một lần (tránh N+1). Id không tồn tại thì không có trong kết quả. */
    Map<Long, UserSummary> findSummaries(Collection<Long> ids);

    /** Tìm các người dùng active có ít nhất một trong các vai trò được truyền vào. */
    java.util.List<UserSummary> findActiveUsersByRoleIn(Collection<String> roleCodes);
}

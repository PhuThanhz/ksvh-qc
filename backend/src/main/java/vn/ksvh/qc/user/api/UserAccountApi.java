package vn.ksvh.qc.user.api;

import java.util.Optional;

/** Tra cứu tài khoản cho module auth. Không lộ entity ra ngoài module user. */
public interface UserAccountApi {

    Optional<UserAccount> findByUsername(String username);

    Optional<UserAccount> findById(Long id);
}

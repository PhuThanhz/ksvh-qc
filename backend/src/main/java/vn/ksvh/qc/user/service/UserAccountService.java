package vn.ksvh.qc.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.user.api.UserAccount;
import vn.ksvh.qc.user.api.UserAccountApi;
import vn.ksvh.qc.user.api.UserSummary;
import vn.ksvh.qc.user.domain.User;
import vn.ksvh.qc.user.domain.UserRepository;

import java.util.Collection;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class UserAccountService implements UserAccountApi {

    private final UserRepository userRepository;

    @Override
    public Optional<UserAccount> findByUsername(String username) {
        return userRepository.findByUsername(username).map(UserAccountService::toAccount);
    }

    @Override
    public Optional<UserAccount> findById(Long id) {
        return userRepository.findById(id).map(UserAccountService::toAccount);
    }

    @Override
    public Map<Long, UserSummary> findSummaries(Collection<Long> ids) {
        Set<Long> distinct = ids.stream().filter(Objects::nonNull).collect(Collectors.toSet());
        if (distinct.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(distinct).stream()
                .collect(Collectors.toUnmodifiableMap(User::getId,
                        u -> new UserSummary(u.getId(), u.getUsername(), u.getFullName(), u.isActive(), u.roleCodes())));
    }

    private static UserAccount toAccount(User u) {
        return new UserAccount(u.getId(), u.getUsername(), u.getFullName(), u.getPasswordHash(), u.isActive(),
                u.roleCodes(), u.permissionCodes());
    }
}

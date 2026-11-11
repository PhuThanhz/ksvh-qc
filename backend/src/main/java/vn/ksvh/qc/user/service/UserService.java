package vn.ksvh.qc.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.shared.web.PageResponse;
import vn.ksvh.qc.shared.web.Pageables;
import vn.ksvh.qc.user.domain.User;
import vn.ksvh.qc.user.domain.UserRepository;
import vn.ksvh.qc.user.dto.UserResponse;

import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    /** Trường được phép sắp xếp ở danh sách người dùng. */
    public static final Set<String> SORTABLE = Set.of("username", "fullName", "createdAt");

    public PageResponse<UserResponse> search(String keyword, Pageable pageable) {
        Pageable safe = Pageables.restrictSort(pageable, SORTABLE);
        Page<User> page = StringUtils.hasText(keyword)
                ? userRepository.searchByKeyword(keyword.trim().toLowerCase(Locale.ROOT), safe)
                : userRepository.findAll(safe);
        return PageResponse.of(page, UserResponse::from);
    }
}

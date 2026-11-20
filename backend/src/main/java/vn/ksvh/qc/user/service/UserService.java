package vn.ksvh.qc.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.NotFoundException;
import vn.ksvh.qc.user.api.UserSessionsInvalidated;
import vn.ksvh.qc.user.domain.Role;
import vn.ksvh.qc.user.domain.RoleRepository;
import vn.ksvh.qc.user.dto.PasswordResetRequest;
import vn.ksvh.qc.user.dto.UserCreateRequest;
import vn.ksvh.qc.user.dto.UserUpdateRequest;
import vn.ksvh.qc.shared.web.PageResponse;
import vn.ksvh.qc.shared.web.Pageables;
import vn.ksvh.qc.user.domain.User;
import vn.ksvh.qc.user.domain.UserRepository;
import vn.ksvh.qc.user.dto.UserResponse;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher events;

    /** Trường được phép sắp xếp ở danh sách người dùng. */
    public static final Set<String> SORTABLE = Set.of("username", "fullName", "createdAt", "lastLoginAt");

    public PageResponse<UserResponse> search(String keyword, String role, Boolean active, Pageable pageable) {
        Pageable safe = Pageables.restrictSort(pageable, SORTABLE);
        Specification<User> spec = Specification.unrestricted();
        if (StringUtils.hasText(keyword)) {
            String kw = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("username")), kw),
                    cb.like(cb.lower(root.get("fullName")), kw)));
        }
        if (StringUtils.hasText(role)) {
            spec = spec.and((root, q, cb) -> cb.equal(root.join("roles").get("code"), role.trim()));
        }
        if (active != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("active"), active));
        }
        return PageResponse.of(userRepository.findAll(spec, safe), UserResponse::from);
    }

    public UserResponse get(Long id) {
        return UserResponse.from(load(id));
    }

    @Transactional
    public UserResponse create(UserCreateRequest req, Long actorId) {
        String username = req.username().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new BusinessException(ErrorCode.USER_USERNAME_TAKEN, "Tên đăng nhập '%s' đã tồn tại".formatted(username));
        }
        User user = new User();
        user.setUsername(username);
        user.setFullName(req.fullName().trim());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setActive(req.active());
        user.getRoles().addAll(resolveRoles(req.roles()));
        user.setUpdatedBy(actorId);
        User saved = userRepository.saveAndFlush(user);
        if (events != null) {
            events.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                    actorId, "USER_CREATE", "USER", saved.getUsername(),
                    "Tạo tài khoản người dùng " + saved.getFullName() + " (" + saved.getUsername() + ")"
            ));
        }
        return UserResponse.from(saved);
    }

    @Transactional
    public UserResponse update(Long id, UserUpdateRequest req, Long actorId) {
        User user = load(id);
        Set<Role> roles = resolveRoles(req.roles());
        boolean willBeAdmin = req.active() && roles.stream().anyMatch(r -> RoleCodes.SYSTEM_ADMIN.equals(r.getCode()));
        boolean isAdmin = user.isActive() && user.roleCodes().contains(RoleCodes.SYSTEM_ADMIN);

        if (id.equals(actorId) && (!req.active() || !grants(roles, PermissionCodes.USER_MANAGE))) {
            throw new BusinessException(ErrorCode.USER_SELF_LOCKOUT,
                    "Bạn không thể tự khoá tài khoản hoặc tự bỏ quyền quản lý người dùng của mình");
        }
        if (isAdmin && !willBeAdmin && userRepository.countActiveWithRole(RoleCodes.SYSTEM_ADMIN) <= 1) {
            throw new BusinessException(ErrorCode.USER_LAST_ADMIN,
                    "Đây là Quản trị hệ thống cuối cùng đang hoạt động, không thể khoá hoặc gỡ vai trò");
        }

        boolean deactivated = user.isActive() && !req.active();
        user.setFullName(req.fullName().trim());
        user.setActive(req.active());
        user.getRoles().clear();
        user.getRoles().addAll(roles);
        user.setUpdatedBy(actorId);
        User saved = userRepository.saveAndFlush(user);
        if (deactivated) {
            events.publishEvent(new UserSessionsInvalidated(id));
        }
        if (events != null) {
            events.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                    actorId, "USER_UPDATE", "USER", saved.getUsername(),
                    "Cập nhật tài khoản " + saved.getFullName() + " (" + saved.getUsername() + ", active=" + saved.isActive() + ")"
            ));
        }
        return UserResponse.from(saved);
    }

    /** Đặt lại mật khẩu và đăng xuất mọi phiên của người dùng đó. */
    @Transactional
    public void resetPassword(Long id, PasswordResetRequest req, Long actorId) {
        User user = load(id);
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        user.setUpdatedBy(actorId);
        userRepository.saveAndFlush(user);
        events.publishEvent(new UserSessionsInvalidated(id));
        if (events != null) {
            events.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                    actorId, "USER_RESET_PASSWORD", "USER", user.getUsername(),
                    "Đặt lại mật khẩu cho tài khoản " + user.getUsername()
            ));
        }
    }

    @Transactional
    public void delete(Long id, Long actorId) {
        if (id.equals(actorId)) {
            throw new BusinessException(ErrorCode.USER_SELF_LOCKOUT, "Bạn không thể tự xoá tài khoản của mình");
        }
        User user = load(id);
        boolean isAdmin = user.isActive() && user.roleCodes().contains(RoleCodes.SYSTEM_ADMIN);
        if (isAdmin && userRepository.countActiveWithRole(RoleCodes.SYSTEM_ADMIN) <= 1) {
            throw new BusinessException(ErrorCode.USER_LAST_ADMIN, "Không thể xoá tài khoản Quản trị hệ thống hoạt động cuối cùng");
        }
        events.publishEvent(new UserSessionsInvalidated(id));
        userRepository.delete(user);
        if (events != null) {
            events.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                    actorId, "USER_DELETE", "USER", user.getUsername(),
                    "Xoá tài khoản " + user.getFullName() + " (" + user.getUsername() + ")"
            ));
        }
    }

    private Set<Role> resolveRoles(Set<String> codes) {
        Set<String> wanted = codes.stream().map(String::trim).collect(Collectors.toSet());
        List<Role> found = roleRepository.findByCodeIn(wanted);
        if (found.size() != wanted.size()) {
            Set<String> known = found.stream().map(Role::getCode).collect(Collectors.toSet());
            Set<String> unknown = new TreeSet<>(wanted);
            unknown.removeAll(known);
            throw new BusinessException(ErrorCode.ROLE_UNKNOWN, "Vai trò không tồn tại: " + unknown);
        }
        return new HashSet<>(found);
    }

    private static boolean grants(Set<Role> roles, String permission) {
        return roles.stream().anyMatch(r -> r.getPermissions().contains(permission));
    }

    private User load(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng #" + id));
    }
}

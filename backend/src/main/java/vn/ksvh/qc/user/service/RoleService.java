package vn.ksvh.qc.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.ksvh.qc.security.permission.Permission;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.security.permission.RoleCodes;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;
import vn.ksvh.qc.shared.error.NotFoundException;
import vn.ksvh.qc.user.domain.Role;
import vn.ksvh.qc.user.domain.RoleRepository;
import vn.ksvh.qc.user.domain.User;
import vn.ksvh.qc.user.domain.UserRepository;
import vn.ksvh.qc.user.dto.PermissionResponse;
import vn.ksvh.qc.user.dto.RoleRequest;
import vn.ksvh.qc.user.dto.RoleResponse;

import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

/**
 * Quản trị vai trò và xem danh mục permission.
 * Permission định nghĩa trong code ({@link Permission}); ở đây chỉ gán permission cho vai trò.
 * Thay đổi quyền có hiệu lực khi người dùng làm mới phiên (tối đa 30 phút).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoleService {

    /** Quyền SYSTEM_ADMIN luôn phải giữ, để hệ thống không bị khoá quản trị. */
    private static final Set<String> ADMIN_REQUIRED = Set.of(PermissionCodes.USER_MANAGE, PermissionCodes.ROLE_MANAGE);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    public List<RoleResponse> list() {
        Map<Long, Long> counts = userCounts();
        List<Role> roles = roleRepository.findAll();
        Map<Long, String> editors = editorNames(roles.stream().map(Role::getUpdatedBy).toList());
        return roles.stream()
                .sorted(Comparator.comparing(Role::isSystemRole).reversed().thenComparing(Role::getId))
                .map(r -> RoleResponse.from(r, counts.getOrDefault(r.getId(), 0L),
                        r.getUpdatedBy() == null ? null : editors.get(r.getUpdatedBy())))
                .toList();
    }

    public RoleResponse get(Long id) {
        return toResponse(load(id));
    }

    /** Danh mục permission (thứ tự như trong code) kèm các vai trò đang có quyền. */
    public List<PermissionResponse> permissions() {
        Map<String, Set<String>> rolesByPermission = new HashMap<>();
        roleRepository.findAll().forEach(r -> r.getPermissions()
                .forEach(p -> rolesByPermission.computeIfAbsent(p, k -> new TreeSet<>()).add(r.getCode())));
        return Arrays.stream(Permission.values())
                .map(p -> new PermissionResponse(p.code(), p.module(), p.description(),
                        List.copyOf(rolesByPermission.getOrDefault(p.code(), Set.of()))))
                .toList();
    }

    @Transactional
    public RoleResponse create(RoleRequest req, Long actorId) {
        String code = req.code().trim();
        if (roleRepository.existsByCodeIgnoreCase(code)) {
            throw new BusinessException(ErrorCode.ROLE_CODE_TAKEN, "Mã vai trò '%s' đã tồn tại".formatted(code));
        }
        Role role = new Role();
        role.setCode(code);
        role.setSystemRole(false);
        apply(role, req, actorId);
        RoleResponse res = toResponse(roleRepository.saveAndFlush(role));
        if (eventPublisher != null) {
            eventPublisher.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                    actorId, "ROLE_CREATE", "ROLE", role.getCode(),
                    "Tạo vai trò " + role.getName() + " (" + role.getCode() + ")"
            ));
        }
        return res;
    }

    @Transactional
    public RoleResponse update(Long id, RoleRequest req, Long actorId) {
        Role role = load(id);
        apply(role, req, actorId);
        RoleResponse res = toResponse(roleRepository.saveAndFlush(role));
        if (eventPublisher != null) {
            eventPublisher.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                    actorId, "ROLE_UPDATE", "ROLE", role.getCode(),
                    "Cập nhật vai trò " + role.getName() + " (" + role.getCode() + ") với " + role.getPermissions().size() + " quyền"
            ));
        }
        return res;
    }

    @Transactional
    public void delete(Long id) {
        Role role = load(id);
        if (role.isSystemRole()) {
            throw new BusinessException(ErrorCode.ROLE_SYSTEM_PROTECTED,
                    "Không thể xoá vai trò gốc '%s'".formatted(role.getName()));
        }
        long users = roleRepository.countUsers(id);
        if (users > 0) {
            throw new BusinessException(ErrorCode.ROLE_IN_USE,
                    "Vai trò '%s' đang được gán cho %d người dùng, hãy gỡ trước khi xoá".formatted(role.getName(), users));
        }
        roleRepository.delete(role);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(vn.ksvh.qc.shared.audit.AuditLogEvent.of(
                    null, "ROLE_DELETE", "ROLE", role.getCode(),
                    "Xoá vai trò " + role.getName() + " (" + role.getCode() + ")"
            ));
        }
    }

    private void apply(Role role, RoleRequest req, Long actorId) {
        Set<String> permissions = validPermissions(req.permissions());
        if (RoleCodes.SYSTEM_ADMIN.equals(role.getCode()) && !permissions.containsAll(ADMIN_REQUIRED)) {
            throw new BusinessException(ErrorCode.ROLE_SYSTEM_PROTECTED,
                    "Vai trò Quản trị hệ thống phải giữ quyền %s để không bị khoá quản trị".formatted(ADMIN_REQUIRED));
        }
        role.setName(req.name().trim());
        role.setDescription(StringUtils.hasText(req.description()) ? req.description().trim() : null);
        role.getPermissions().clear();
        role.getPermissions().addAll(permissions);
        role.setUpdatedBy(actorId);
    }

    private static Set<String> validPermissions(Set<String> codes) {
        Set<String> unknown = codes.stream()
                .filter(c -> Permission.fromCode(c).isEmpty())
                .collect(Collectors.toCollection(TreeSet::new));
        if (!unknown.isEmpty()) {
            throw new BusinessException(ErrorCode.PERMISSION_UNKNOWN, "Quyền không tồn tại: " + unknown);
        }
        return Set.copyOf(codes);
    }

    private Role load(Long id) {
        return roleRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy vai trò #" + id));
    }

    private RoleResponse toResponse(Role r) {
        String editor = r.getUpdatedBy() == null ? null
                : userRepository.findById(r.getUpdatedBy()).map(User::getFullName).orElse(null);
        return RoleResponse.from(r, roleRepository.countUsers(r.getId()), editor);
    }

    private Map<Long, Long> userCounts() {
        return roleRepository.countUsersByRole().stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
    }

    private Map<Long, String> editorNames(List<Long> ids) {
        List<Long> distinct = ids.stream().filter(Objects::nonNull).distinct().toList();
        if (distinct.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(distinct).stream()
                .collect(Collectors.toMap(User::getId, User::getFullName));
    }
}

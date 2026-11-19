import { useConfirm } from '@/components/feedback/useConfirm'
import { useNotify } from '@/components/feedback/useNotify'
import { useSaveRole } from '@/features/roles/hooks/useRoles'
import type { PermissionInfo, Role } from '@/features/roles/roles.types'
import { getErrorMessage } from '@/lib/http'

/** Quyền vai trò Quản trị hệ thống luôn phải giữ (khớp RoleService.ADMIN_REQUIRED ở backend). */
const ADMIN_ROLE = 'SYSTEM_ADMIN'
const ADMIN_REQUIRED = new Set(['user:manage', 'role:manage'])

/** Ô không cho bấm: trả lý do để hiện tooltip, hoặc null nếu được phép đổi. */
export function lockReason(role: Role, permission: PermissionInfo): string | null {
  if (role.code === ADMIN_ROLE && ADMIN_REQUIRED.has(permission.code)) {
    return 'Quản trị hệ thống luôn giữ quyền này để không bị khoá quản trị'
  }
  return null
}

/** Cấp / thu một quyền của một vai trò từ bảng ma trận, có hộp xác nhận. Server vẫn kiểm tra lại. */
export function useTogglePermission() {
  const confirm = useConfirm()
  const notify = useNotify()
  const save = useSaveRole()

  const toggle = async (role: Role, permission: PermissionInfo) => {
    const granted = role.permissions.includes(permission.code)
    const ok = await confirm({
      title: granted ? 'Thu hồi quyền?' : 'Cấp quyền?',
      content: granted
        ? `Vai trò "${role.name}" sẽ mất quyền "${permission.description}" (${permission.code}). Người dùng bị ảnh hưởng khi làm mới phiên (tối đa 30 phút).`
        : `Vai trò "${role.name}" sẽ có thêm quyền "${permission.description}" (${permission.code}).`,
      okText: granted ? 'Thu hồi' : 'Cấp quyền',
      danger: granted,
    })
    if (!ok) return
    const permissions = granted
      ? role.permissions.filter((c) => c !== permission.code)
      : [...role.permissions, permission.code]
    save.mutate(
      {
        id: role.id,
        body: { code: role.code, name: role.name, description: role.description ?? undefined, permissions },
      },
      {
        onSuccess: () => notify.success(granted ? `Đã thu hồi quyền của "${role.name}"` : `Đã cấp quyền cho "${role.name}"`),
        onError: (err) => notify.error(getErrorMessage(err)),
      },
    )
  }

  return { toggle, saving: save.isPending, savingRoleId: save.variables?.id }
}

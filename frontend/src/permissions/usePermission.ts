import { useMemo } from 'react'
import { useSession } from '@/features/auth'
import { hasAllPermissions, hasAnyPermission, hasPermission, satisfies } from '@/permissions/permission.service'
import type { AccessRule, Permission } from '@/permissions/permissions'

/** Kiểm tra quyền của người dùng hiện tại trong component. */
export function usePermission() {
  const { user } = useSession()
  return useMemo(
    () => ({
      can: (p: Permission) => hasPermission(user, p),
      canAny: (ps: readonly Permission[]) => hasAnyPermission(user, ps),
      canAll: (ps: readonly Permission[]) => hasAllPermissions(user, ps),
      allows: (rule: AccessRule | undefined) => satisfies(user, rule),
    }),
    [user],
  )
}

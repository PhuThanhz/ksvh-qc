import type { AccessRule, Permission } from '@/permissions/permissions'

/** Đối tượng có danh sách permission (SessionUser thoả mãn). */
export interface PermissionHolder {
  permissions: readonly Permission[]
}

/** Các hàm thuần, không phụ thuộc React → dễ unit test, dùng được cả ngoài component. */
export function hasPermission(user: PermissionHolder | null | undefined, permission: Permission): boolean {
  return !!user && user.permissions.includes(permission)
}

export function hasAnyPermission(user: PermissionHolder | null | undefined, permissions: readonly Permission[]) {
  return permissions.some((p) => hasPermission(user, p))
}

export function hasAllPermissions(user: PermissionHolder | null | undefined, permissions: readonly Permission[]) {
  return permissions.every((p) => hasPermission(user, p))
}

/** rule không có (undefined) = ai đã đăng nhập cũng được. */
export function satisfies(user: PermissionHolder | null | undefined, rule: AccessRule | undefined): boolean {
  if (!rule) return !!user
  if (typeof rule === 'string') return hasPermission(user, rule)
  if ('anyOf' in rule) return hasAnyPermission(user, rule.anyOf)
  return hasAllPermissions(user, rule.allOf)
}

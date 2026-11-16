import { ROUTES } from '@/constants/routes'
import { PERMISSIONS } from '@/permissions'
import type { AppRoute } from '@/types/route.types'

/** Xem vai trò / quyền: người quản lý người dùng (để gán) hoặc người quản trị vai trò. */
const CAN_VIEW = { anyOf: [PERMISSIONS.USER.READ, PERMISSIONS.ROLE.MANAGE] } as const

export const permissionsAdminRoutes: AppRoute[] = [
  {
    path: ROUTES.admin.permissions,
    handle: { access: CAN_VIEW, menu: { label: 'Quyền (Permission)', icon: 'permissions', group: 'system' } },
    lazy: () => import('@/features/roles/pages/PermissionListPage').then((m) => ({ Component: m.PermissionListPage })),
  },
]

export const rolesAdminRoutes: AppRoute[] = [
  {
    path: ROUTES.admin.roles,
    handle: { access: CAN_VIEW, menu: { label: 'Vai trò (Role)', icon: 'roles', group: 'system' } },
    lazy: () => import('@/features/roles/pages/RoleListPage').then((m) => ({ Component: m.RoleListPage })),
  },
]

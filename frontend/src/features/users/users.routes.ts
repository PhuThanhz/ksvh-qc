import type { AppRoute } from '@/types/route.types'
import { ROUTES } from '@/constants/routes'
import { PERMISSIONS } from '@/permissions'

export const usersAdminRoutes: AppRoute[] = [
  {
    path: ROUTES.admin.users,
    handle: { access: PERMISSIONS.USER.READ, menu: { label: 'Tài khoản người dùng', icon: 'users', group: 'system' } },
    lazy: () => import('@/features/users/pages/UserListPage').then((m) => ({ Component: m.UserListPage })),
  },
]

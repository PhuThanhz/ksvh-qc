import { ROUTES } from '@/constants/routes'
import type { AppRoute } from '@/types/route.types'

export const dashboardRoutes: AppRoute[] = [
  {
    path: ROUTES.admin.root,
    handle: { menu: { label: 'Tổng quan', icon: 'dashboard' } },
    lazy: () => import('@/features/dashboard/pages/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
  },
]

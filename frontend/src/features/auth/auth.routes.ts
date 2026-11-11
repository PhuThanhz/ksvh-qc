import type { RouteObject } from 'react-router'
import { ROUTES } from '@/constants/routes'

export const authRoutes: RouteObject[] = [
  {
    path: ROUTES.login,
    lazy: () => import('@/features/auth/pages/LoginPage').then((m) => ({ Component: m.LoginPage })),
  },
]

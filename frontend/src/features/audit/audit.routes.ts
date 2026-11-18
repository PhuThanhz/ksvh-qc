import { ROUTES } from '@/constants/routes'
import { PERMISSIONS } from '@/permissions'
import type { AppRoute } from '@/types/route.types'

export const auditAdminRoutes: AppRoute[] = [
  {
    path: ROUTES.admin.auditLogs,
    handle: {
      access: PERMISSIONS.SYSTEM.LOG_READ,
      menu: { label: 'Nhật ký hệ thống', icon: 'auditLogs', group: 'system' },
    },
    lazy: () => import('@/features/audit/pages/AuditLogPage').then((m) => ({ Component: m.AuditLogPage })),
  },
]

import { ROUTES } from '@/constants/routes'
import { PERMISSIONS } from '@/permissions'
import type { AppRoute } from '@/types/route.types'

export const reportsAdminRoutes: AppRoute[] = [
  {
    path: ROUTES.admin.reports,
    handle: {
      access: { anyOf: [PERMISSIONS.REPORT.READ, PERMISSIONS.INSPECTION.READ_ALL] },
      menu: { label: 'Báo cáo & Phân tích kiểm soát', icon: 'reports', group: 'operations' },
    },
    lazy: () => import('@/features/reports/pages/ReportPage').then((m) => ({ Component: m.ReportPage })),
  },
]

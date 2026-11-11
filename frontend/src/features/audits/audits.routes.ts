import { ROUTES } from '@/constants/routes'
import { PERMISSIONS } from '@/permissions'
import type { AppRoute } from '@/types/route.types'

/** Màn hình điện thoại (/qc) của module chấm điểm. */
export const auditsMobileRoutes: AppRoute[] = [
  {
    path: ROUTES.qc.root,
    handle: { menu: { label: 'Việc chấm', icon: 'home' } },
    lazy: () => import('@/features/audits/pages/mobile/AuditHomePage').then((m) => ({ Component: m.AuditHomePage })),
  },
  {
    path: ROUTES.qc.checkinDemo,
    handle: { access: PERMISSIONS.MEDIA.UPLOAD, menu: { label: 'Thử GPS & ảnh', icon: 'checkin' } },
    lazy: () => import('@/features/audits/pages/mobile/CheckinDemoPage').then((m) => ({ Component: m.CheckinDemoPage })),
  },
]

import { ROUTES } from '@/constants/routes'
import { PERMISSIONS } from '@/permissions'
import type { AppRoute } from '@/types/route.types'

/** Màn hình điện thoại (/qc) của module phiếu chấm (inspection). */
export const inspectionsMobileRoutes: AppRoute[] = [
  {
    path: ROUTES.qc.root,
    handle: { menu: { label: 'Việc chấm', icon: 'home' } },
    lazy: () => import('@/features/inspections/pages/mobile/InspectionHomePage').then((m) => ({ Component: m.InspectionHomePage })),
  },
  {
    path: ROUTES.qc.checkinDemo,
    handle: { access: PERMISSIONS.MEDIA.UPLOAD, menu: { label: 'Thử GPS & ảnh', icon: 'checkin' } },
    lazy: () => import('@/features/inspections/pages/mobile/CheckinDemoPage').then((m) => ({ Component: m.CheckinDemoPage })),
  },
]

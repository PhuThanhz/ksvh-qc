import { ROUTES } from '@/constants/routes'
import { PERMISSIONS } from '@/permissions'
import type { AppRoute } from '@/types/route.types'

/** Tuyến đường quản trị KSVH (/admin). */
export const inspectionsAdminRoutes: AppRoute[] = [
  {
    path: ROUTES.admin.plans,
    handle: {
      access: PERMISSIONS.PLAN.READ,
      menu: { label: 'Kế hoạch kiểm tra', icon: 'plans', group: 'operations' },
    },
    lazy: () =>
      import('@/features/inspections/pages/admin/PlanListPage').then((m) => ({ Component: m.PlanListPage })),
  },
  {
    path: ROUTES.admin.inspections,
    handle: {
      access: { anyOf: [PERMISSIONS.INSPECTION.READ_ALL, PERMISSIONS.INSPECTION.READ_OWN] },
      menu: { label: 'Phiếu chấm KSVH', icon: 'inspections', group: 'operations' },
    },
    lazy: () =>
      import('@/features/inspections/pages/admin/InspectionListPage').then((m) => ({ Component: m.InspectionListPage })),
  },
  {
    path: ROUTES.admin.findings,
    handle: {
      access: { anyOf: [PERMISSIONS.FINDING.RESPOND, PERMISSIONS.FINDING.VERIFY, PERMISSIONS.INSPECTION.READ_ALL] },
      menu: { label: 'Xử lý lỗi & Khắc phục', icon: 'findings', group: 'operations' },
    },
    lazy: () =>
      import('@/features/inspections/pages/admin/FindingListPage').then((m) => ({ Component: m.FindingListPage })),
  },
]

/** Màn hình điện thoại (/qc) của module phiếu chấm (inspection). */
export const inspectionsMobileRoutes: AppRoute[] = [
  {
    path: ROUTES.qc.root,
    handle: { menu: { label: 'Việc chấm', icon: 'home' } },
    lazy: () =>
      import('@/features/inspections/pages/mobile/InspectionHomePage').then((m) => ({
        Component: m.InspectionHomePage,
      })),
  },
  {
    path: ROUTES.qc.execute,
    lazy: () =>
      import('@/features/inspections/pages/mobile/InspectionExecutionPage').then((m) => ({
        Component: m.InspectionExecutionPage,
      })),
  },
]

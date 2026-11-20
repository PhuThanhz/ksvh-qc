import { ROUTES } from '@/constants/routes'
import { PERMISSIONS } from '@/permissions'
import type { AppRoute } from '@/types/route.types'

/** Tuyến đường quản trị KSVH (/admin). */
export const inspectionsAdminRoutes: AppRoute[] = [
  {
    path: ROUTES.admin.plans,
    handle: {
      access: PERMISSIONS.PLAN.READ,
      menu: { label: 'Kế hoạch kiểm soát', icon: 'plans', group: 'operations' },
    },
    lazy: () =>
      import('@/features/inspections/pages/admin/PlanListPage').then((m) => ({ Component: m.PlanListPage })),
  },
  {
    path: ROUTES.admin.inspections,
    handle: {
      access: { anyOf: [PERMISSIONS.INSPECTION.READ_ALL, PERMISSIONS.INSPECTION.READ_OWN] },
      menu: { label: 'Biên bản kiểm tra KSVH', icon: 'inspections', group: 'operations' },
    },
    lazy: () =>
      import('@/features/inspections/pages/admin/InspectionListPage').then((m) => ({ Component: m.InspectionListPage })),
  },
  {
    path: ROUTES.admin.findings,
    handle: {
      access: { anyOf: [PERMISSIONS.FINDING.RESPOND, PERMISSIONS.FINDING.VERIFY, PERMISSIONS.INSPECTION.READ_ALL] },
      menu: { label: 'Khắc phục vi phạm', icon: 'findings', group: 'operations' },
    },
    lazy: () =>
      import('@/features/inspections/pages/admin/FindingListPage').then((m) => ({ Component: m.FindingListPage })),
  },
  {
    path: ROUTES.admin.riskProfiles,
    handle: {
      access: { anyOf: [PERMISSIONS.INSPECTION.READ_ALL, PERMISSIONS.INSPECTION.READ_OWN, PERMISSIONS.REPORT.READ] },
      menu: { label: 'Hồ sơ rủi ro cơ sở', icon: 'riskProfiles', group: 'operations' },
    },
    lazy: () =>
      import('@/features/inspections/pages/admin/RestaurantRiskProfilePage').then((m) => ({
        Component: m.RestaurantRiskProfilePage,
      })),
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

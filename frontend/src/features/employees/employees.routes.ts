import { ROUTES } from '@/constants/routes'
import { PERMISSIONS } from '@/permissions'
import type { AppRoute } from '@/types/route.types'

export const employeesAdminRoutes: AppRoute[] = [
  {
    path: ROUTES.admin.employees,
    handle: { access: PERMISSIONS.EMPLOYEE.READ, menu: { label: 'Nhân viên', icon: 'employees', group: 'system' } },
    lazy: () => import('@/features/employees/pages/EmployeeListPage').then((m) => ({ Component: m.EmployeeListPage })),
  },
]

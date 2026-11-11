import { createBrowserRouter } from 'react-router'
import { buildMenu } from '@/app/router/menu'
import { GuestRoute, HomeRedirect, ProtectedRoute } from '@/app/router/guards'
import { AdminShell, MobileShell } from '@/app/router/shells'
import { ErrorState } from '@/components/feedback/ErrorState'
import { RouteErrorBoundary } from '@/components/feedback/RouteErrorBoundary'
import { auditsMobileRoutes } from '@/features/audits'
import { authRoutes } from '@/features/auth'
import { dashboardRoutes } from '@/features/dashboard'
import { usersAdminRoutes } from '@/features/users'
import { AREA_ACCESS } from '@/permissions'

/**
 * Mỗi feature tự khai báo route của mình (*.routes.ts). File này chỉ ghép lại.
 * Thêm module mới: thêm mảng route của feature vào adminRoutes hoặc qcRoutes.
 */
const adminRoutes = [...dashboardRoutes, ...usersAdminRoutes]
const qcRoutes = [...auditsMobileRoutes]

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/', element: <HomeRedirect /> },
      { element: <GuestRoute />, children: authRoutes },
      {
        element: <ProtectedRoute access={AREA_ACCESS.admin} />,
        children: [{ element: <AdminShell menu={buildMenu(adminRoutes)} />, children: adminRoutes }],
      },
      {
        element: <ProtectedRoute access={AREA_ACCESS.qc} />,
        children: [{ element: <MobileShell tabs={buildMenu(qcRoutes)} />, children: qcRoutes }],
      },
      { path: '*', element: <ErrorState kind={404} /> },
    ],
  },
])

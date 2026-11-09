import { createBrowserRouter } from 'react-router'
import { RequireAuth } from '@/app/RequireAuth'
import { RootRedirect } from '@/app/RootRedirect'
import { LoginPage } from '@/features/auth/LoginPage'

// /admin (antd) và /qc (antd-mobile) được tải riêng: điện thoại không phải tải code dashboard.
export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: <LoginPage /> },
  {
    // Dashboard quản lý trên máy tính
    path: '/admin',
    element: <RequireAuth roles={['ADMIN', 'MANAGER']} />,
    children: [
      {
        lazy: async () => ({ Component: (await import('@/features/admin/AdminLayout')).AdminLayout }),
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/features/admin/DashboardPage')).DashboardPage }),
          },
        ],
      },
    ],
  },
  {
    // Giao diện chấm QC trên điện thoại (quản lý cũng vào được để kiểm tra)
    path: '/qc',
    element: <RequireAuth roles={['AUDITOR', 'MANAGER', 'ADMIN']} />,
    children: [
      {
        lazy: async () => ({ Component: (await import('@/features/qc/QcLayout')).QcLayout }),
        children: [
          { index: true, lazy: async () => ({ Component: (await import('@/features/qc/QcHomePage')).QcHomePage }) },
          {
            path: 'checkin-demo',
            lazy: async () => ({ Component: (await import('@/features/qc/CheckinDemoPage')).CheckinDemoPage }),
          },
        ],
      },
    ],
  },
  { path: '*', element: <RootRedirect /> },
])

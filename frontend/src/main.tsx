import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider as AntdConfig } from 'antd'
import antdVi from 'antd/locale/vi_VN'
import { ConfigProvider as MobileConfig, unstableSetRender } from 'antd-mobile'
import mobileVi from 'antd-mobile/es/locales/vi-VN'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from '@/app/router'
import './index.css'

// antd-mobile dùng hàm render cũ cho Toast/Dialog; khai báo lại để chạy với React 19.
unstableSetRender((node, container) => {
  const root = createRoot(container)
  root.render(node)
  return async () => root.unmount()
})

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AntdConfig locale={antdVi}>
        <MobileConfig locale={mobileVi}>
          <RouterProvider router={router} />
        </MobileConfig>
      </AntdConfig>
    </QueryClientProvider>
  </StrictMode>,
)

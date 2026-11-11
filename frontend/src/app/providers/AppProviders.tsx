import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { App as AntdApp, ConfigProvider as AntdConfig } from 'antd'
import antdVi from 'antd/locale/vi_VN'
import { ConfigProvider as MobileConfig, unstableSetRender } from 'antd-mobile'
import mobileVi from 'antd-mobile/es/locales/vi-VN'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { antdTheme } from '@/app/config/theme'

// antd-mobile dùng hàm render cũ cho Toast/Dialog; khai báo lại để chạy với React 19.
unstableSetRender((node, container) => {
  const root = createRoot(container)
  root.render(node)
  return async () => root.unmount()
})

export interface AppProvidersProps {
  queryClient: QueryClient
  children: ReactNode
}

/** Gom mọi provider toàn cục. <AntdApp> cung cấp message/modal/notification qua App.useApp(). */
export function AppProviders({ queryClient, children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AntdConfig locale={antdVi} theme={antdTheme}>
        <AntdApp>
          <MobileConfig locale={mobileVi}>{children}</MobileConfig>
        </AntdApp>
      </AntdConfig>
    </QueryClientProvider>
  )
}

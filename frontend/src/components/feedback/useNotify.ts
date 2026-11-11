import { App } from 'antd'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

export interface NotifyOptions {
  title: ReactNode
  description?: ReactNode
  duration?: number
}

/**
 * Thông báo nhanh (toast/message) và thông báo góc phải (notification) cho kênh /admin.
 * Dùng thông qua App.useApp() để kế thừa theme và context của <AntdApp>.
 */
export function useNotify() {
  const { message, notification } = App.useApp()

  return useMemo(
    () => ({
      success: (content: ReactNode, duration?: number) => message.success(content, duration),
      error: (content: ReactNode, duration?: number) => message.error(content, duration),
      info: (content: ReactNode, duration?: number) => message.info(content, duration),
      warning: (content: ReactNode, duration?: number) => message.warning(content, duration),
      loading: (content: ReactNode, duration = 0) => message.loading(content, duration),
      notifySuccess: ({ title, description, duration }: NotifyOptions) =>
        notification.success({ title, description, duration }),
      notifyError: ({ title, description, duration }: NotifyOptions) =>
        notification.error({ title, description, duration }),
      notifyInfo: ({ title, description, duration }: NotifyOptions) =>
        notification.info({ title, description, duration }),
      notifyWarning: ({ title, description, duration }: NotifyOptions) =>
        notification.warning({ title, description, duration }),
    }),
    [message, notification],
  )
}

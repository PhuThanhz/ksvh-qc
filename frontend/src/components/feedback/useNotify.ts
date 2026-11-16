import { App } from 'antd'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

export interface NotifyOptions {
  title?: ReactNode
  message?: ReactNode
  description?: ReactNode
  duration?: number
}

/**
 * Toast thông báo góc trên bên phải (Top-Right Notification) chuẩn Apple macOS.
 * Hiển thị to, rõ ràng, sang xịn mịn kế thừa từ <AntdApp>.
 */
export function useNotify() {
  const { notification, message } = App.useApp()

  return useMemo(
    () => ({
      success: (content: ReactNode, duration = 3) =>
        notification.success({
          title: content,
          placement: 'topRight',
          duration,
        }),
      error: (content: ReactNode, duration = 4.5) =>
        notification.error({
          title: content,
          placement: 'topRight',
          duration,
        }),
      info: (content: ReactNode, duration = 3) =>
        notification.info({
          title: content,
          placement: 'topRight',
          duration,
        }),
      warning: (content: ReactNode, duration = 4) =>
        notification.warning({
          title: content,
          placement: 'topRight',
          duration,
        }),
      loading: (content: ReactNode, duration = 0) => message.loading(content, duration),
      notifySuccess: ({ title, message: msg, description, duration = 3 }: NotifyOptions) =>
        notification.success({ title: title ?? msg, description, placement: 'topRight', duration }),
      notifyError: ({ title, message: msg, description, duration = 4.5 }: NotifyOptions) =>
        notification.error({ title: title ?? msg, description, placement: 'topRight', duration }),
      notifyInfo: ({ title, message: msg, description, duration = 3 }: NotifyOptions) =>
        notification.info({ title: title ?? msg, description, placement: 'topRight', duration }),
      notifyWarning: ({ title, message: msg, description, duration = 4 }: NotifyOptions) =>
        notification.warning({ title: title ?? msg, description, placement: 'topRight', duration }),
    }),
    [notification, message],
  )
}

import { Dialog, Toast } from 'antd-mobile'
import type { ReactNode } from 'react'

/** Toast nhanh cho màn hình điện thoại /qc (bọc antd-mobile Toast). */
export const mobileToast = {
  success(content: ReactNode, duration = 2000) {
    Toast.show({ icon: 'success', content, duration })
  },
  fail(content: ReactNode, duration = 2500) {
    Toast.show({ icon: 'fail', content, duration })
  },
  info(content: ReactNode, duration = 2000) {
    Toast.show({ content, duration })
  },
  loading(content: ReactNode = 'Đang xử lý…') {
    Toast.show({ icon: 'loading', content, duration: 0, maskClickable: false })
  },
  clear() {
    Toast.clear()
  },
}

export interface MobileConfirmOptions {
  title: ReactNode
  content?: ReactNode
  confirmText?: string
  cancelText?: string
}

/** Hộp xác nhận cho màn hình điện thoại /qc (trả Promise<boolean> để dùng với await). */
export function confirmMobile({
  title,
  content,
  confirmText = 'Xác nhận',
  cancelText = 'Huỷ',
}: MobileConfirmOptions): Promise<boolean> {
  return Dialog.confirm({
    title,
    content,
    confirmText,
    cancelText,
  })
}

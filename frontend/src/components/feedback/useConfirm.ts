import { App } from 'antd'
import type { ReactNode } from 'react'

export interface ConfirmOptions {
  title: ReactNode
  content?: ReactNode
  okText?: string
  danger?: boolean
}

/** Hộp xác nhận chuẩn (xoá, nộp, duyệt). Trả Promise<boolean> để dùng với await. */
export function useConfirm() {
  const { modal } = App.useApp()
  return ({ title, content, okText = 'Xác nhận', danger = false }: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      modal.confirm({
        title,
        content,
        okText,
        cancelText: 'Huỷ',
        okButtonProps: { danger },
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
}

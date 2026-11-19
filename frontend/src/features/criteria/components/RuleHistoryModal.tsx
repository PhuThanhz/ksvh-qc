import { Modal, Typography } from 'antd'
import type { ReactNode } from 'react'

export interface RuleHistoryModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/** Lịch sử các phiên bản của một quy tắc (bản cũ giữ lại để đối soát, không sửa). */
export function RuleHistoryModal({ open, title, onClose, children }: RuleHistoryModalProps) {
  return (
    <Modal open={open} title={title} footer={null} width={860} centered onCancel={onClose} destroyOnHidden>
      <Typography.Paragraph type="secondary">
        Mỗi lần thay đổi tạo một phiên bản mới có ngày áp dụng. Lỗi phát sinh trước ngày đó vẫn tính theo phiên bản cũ.
        Chỉ xoá được phiên bản chưa tới ngày áp dụng.
      </Typography.Paragraph>
      {children}
    </Modal>
  )
}

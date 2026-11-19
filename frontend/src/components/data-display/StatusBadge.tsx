import { Tag } from 'antd'
import { memo } from 'react'

export type BadgeTone = 'default' | 'success' | 'processing' | 'warning' | 'danger'

const COLOR: Record<BadgeTone, string> = {
  default: 'default',
  success: 'success',
  processing: 'processing',
  warning: 'warning',
  danger: 'error',
}

export interface StatusBadgeProps<S extends string> {
  status: S
  /** Bảng trạng thái → nhãn/màu, khai báo MỘT lần trong feature (vd: AUDIT_STATUS_META). */
  meta: Record<S, { label: string; tone: BadgeTone }>
}

/** Nhãn trạng thái: nền rất nhạt, chữ đậm cùng tông, chấm màu phía trước (màu ở .status-tag--*). */
function BaseStatusBadge<S extends string>({ status, meta }: StatusBadgeProps<S>) {
  const m = meta[status]
  return <Tag className={`status-tag status-tag--${COLOR[m.tone]}`}>{m.label}</Tag>
}

export const StatusBadge = memo(BaseStatusBadge) as typeof BaseStatusBadge

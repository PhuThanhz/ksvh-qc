import { Tag } from 'antd'

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

export function StatusBadge<S extends string>({ status, meta }: StatusBadgeProps<S>) {
  const m = meta[status]
  return <Tag color={COLOR[m.tone]}>{m.label}</Tag>
}

import type { CSSProperties, ReactNode } from 'react'

export type StatusVariant = 'active' | 'inactive' | 'pending' | 'draft' | 'warning' | 'info'

export interface StatusBadgeProps {
  status?: StatusVariant | boolean | string
  label?: ReactNode
  dot?: boolean
  style?: CSSProperties
  className?: string
}

/**
 * Huy hiệu trạng thái Apple Glass & Minimalist dạng viên thuốc bo tròn (radius 9999px).
 * Phân cấp màu rõ ràng:
 * - active / true: Xanh lá nhẹ (--status-up-bg, --status-up-text)
 * - inactive / false: Đỏ nhẹ (--status-down-bg, --status-down)
 * - pending / warning: Vàng hổ phách (--brand-amber-light, --brand-amber-text)
 * - draft / info: Xám / Xanh dương
 */
export function StatusBadge({
  status = 'active',
  label,
  dot = true,
  style,
  className = '',
}: StatusBadgeProps) {
  // Chuẩn hoá status
  let variant: StatusVariant = 'active'
  let defaultLabel: ReactNode = 'Hoạt động'

  if (typeof status === 'boolean') {
    variant = status ? 'active' : 'inactive'
    defaultLabel = status ? 'Hoạt động' : 'Tạm ngưng'
  } else if (typeof status === 'string') {
    const s = status.toLowerCase()
    if (s === 'active' || s === 'hoat_dong' || s === 'done' || s === 'completed' || s === 'pass') {
      variant = 'active'
      defaultLabel = 'Hoạt động'
    } else if (s === 'inactive' || s === 'tam_ngung' || s === 'locked' || s === 'failed' || s === 'fail') {
      variant = 'inactive'
      defaultLabel = 'Tạm ngưng'
    } else if (s === 'pending' || s === 'cho_duyet' || s === 'in_progress' || s === 'review') {
      variant = 'pending'
      defaultLabel = 'Chờ duyệt'
    } else if (s === 'draft' || s === 'nhap') {
      variant = 'draft'
      defaultLabel = 'Bản nháp'
    } else if (s === 'warning' || s === 'canh_bao') {
      variant = 'warning'
      defaultLabel = 'Cảnh báo'
    } else {
      variant = 'info'
      defaultLabel = status
    }
  }

  const variantStyles: Record<StatusVariant, { bg: string; text: string; dot: string; border: string }> = {
    active: {
      bg: 'var(--status-up-bg)',
      text: 'var(--status-up-text)',
      dot: 'var(--status-up)',
      border: 'rgba(16, 185, 129, 0.25)',
    },
    inactive: {
      bg: 'var(--status-down-bg)',
      text: 'var(--status-down)',
      dot: 'var(--status-down)',
      border: 'rgba(239, 68, 68, 0.25)',
    },
    pending: {
      bg: 'var(--brand-amber-light)',
      text: 'var(--brand-amber-text)',
      dot: 'var(--brand-amber)',
      border: 'rgba(245, 158, 11, 0.25)',
    },
    draft: {
      bg: '#f1f5f9',
      text: '#475569',
      dot: '#94a3b8',
      border: 'rgba(148, 163, 184, 0.25)',
    },
    warning: {
      bg: 'var(--brand-amber-light)',
      text: 'var(--brand-amber-text)',
      dot: 'var(--brand-amber)',
      border: 'rgba(245, 158, 11, 0.25)',
    },
    info: {
      bg: 'var(--action-view-bg)',
      text: 'var(--action-view)',
      dot: 'var(--action-view)',
      border: 'rgba(37, 99, 235, 0.25)',
    },
  }

  const current = variantStyles[variant]

  return (
    <span
      className={`status-pill ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: 12.5,
        fontWeight: 500,
        background: current.bg,
        color: current.text,
        border: `1px solid ${current.border}`,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: current.dot,
            flexShrink: 0,
          }}
        />
      )}
      <span>{label ?? defaultLabel}</span>
    </span>
  )
}

import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import type { ReactNode } from 'react'

export interface ActionItemProps {
  icon: ReactNode
  tooltip: string
  ariaLabel?: string
  className?: string
  disabled?: boolean
  disabledReason?: string
  onClick?: () => void
}

/**
 * Nút thao tác đơn lẻ chuẩn hoá 32px x 32px, bo góc 6px theo phong cách Apple Minimalist.
 */
export function ActionItem({
  icon,
  tooltip,
  ariaLabel,
  className = '',
  disabled = false,
  disabledReason,
  onClick,
}: ActionItemProps) {
  const isBlocked = disabled || Boolean(disabledReason)
  const title = isBlocked && disabledReason ? disabledReason : tooltip

  return (
    <Tooltip title={title}>
      <span>
        <Button
          type="text"
          className={`action-btn ${className}`.trim()}
          icon={icon}
          aria-label={ariaLabel ?? tooltip}
          disabled={isBlocked}
          onClick={onClick}
        />
      </span>
    </Tooltip>
  )
}

export interface ActionGroupProps {
  /** Xem chi tiết */
  onView?: () => void
  viewTooltip?: string

  /** Chỉnh sửa */
  onEdit?: () => void
  editTooltip?: string
  editDisabled?: boolean
  editDisabledReason?: string

  /** Khóa / Mở (Toggle trạng thái) */
  onToggle?: () => void
  isActive?: boolean
  toggleTooltip?: string
  toggleDisabled?: boolean

  /** Xoá */
  onDelete?: () => void
  deleteTooltip?: string
  deleteDisabled?: boolean
  deleteDisabledReason?: string

  /** Nút thao tác bổ sung */
  extra?: ReactNode
}

/**
 * Cụm nút thao tác bảng (ActionGroup):
 * - Kích thước: 32px x 32px, bo góc 6px.
 * - Xem: Con mắt xanh (--action-view-bg / --action-view)
 * - Sửa: Cây bút cam (--action-edit-bg / --action-edit)
 * - Khóa / Mở: Toggle xanh khi hoạt động, đỏ khi tạm ngưng (--action-on / --action-danger)
 * - Xoá: Thùng rác đỏ (--action-danger-bg / --action-danger)
 */
export function ActionGroup({
  onView,
  viewTooltip = 'Xem chi tiết',

  onEdit,
  editTooltip = 'Chỉnh sửa',
  editDisabled = false,
  editDisabledReason,

  onToggle,
  isActive = true,
  toggleTooltip,
  toggleDisabled = false,

  onDelete,
  deleteTooltip = 'Xoá',
  deleteDisabled = false,
  deleteDisabledReason,

  extra,
}: ActionGroupProps) {
  const defaultToggleTooltip = isActive ? 'Khóa / Tạm ngưng' : 'Kích hoạt / Mở lại'

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
      }}
    >
      {onView && (
        <ActionItem
          icon={<EyeOutlined />}
          tooltip={viewTooltip}
          className="action-btn-view"
          onClick={onView}
        />
      )}

      {onEdit && (
        <ActionItem
          icon={<EditOutlined />}
          tooltip={editTooltip}
          className="action-btn-edit"
          disabled={editDisabled}
          disabledReason={editDisabledReason}
          onClick={onEdit}
        />
      )}

      {onToggle && (
        <ActionItem
          icon={isActive ? <StopOutlined /> : <CheckCircleOutlined />}
          tooltip={toggleTooltip ?? defaultToggleTooltip}
          className={isActive ? 'action-btn-danger' : 'action-btn-on'}
          disabled={toggleDisabled}
          onClick={onToggle}
        />
      )}

      {onDelete && (
        <ActionItem
          icon={<DeleteOutlined />}
          tooltip={deleteTooltip}
          className="action-btn-delete"
          disabled={deleteDisabled}
          disabledReason={deleteDisabledReason}
          onClick={onDelete}
        />
      )}

      {extra}
    </div>
  )
}

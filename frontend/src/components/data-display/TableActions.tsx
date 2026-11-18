import { DeleteOutlined, EditOutlined, EyeOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { Button, Space, Tooltip } from 'antd'
import type { ReactNode } from 'react'
import { ProtectedAction, type AccessRule } from '@/permissions'

export type ActionTone = 'view' | 'add' | 'edit' | 'delete' | 'neutral'

export interface ActionButtonProps {
  tone?: ActionTone
  icon: ReactNode
  tooltip: string
  ariaLabel?: string
  disabled?: boolean
  disabledReason?: string
  onClick?: () => void
}

/** Nút thao tác đơn lẻ chuẩn hoá kích thước 30x30, màu sắc theo tone, tooltip và aria-label. */
export function ActionButton({
  tone = 'neutral',
  icon,
  tooltip,
  ariaLabel,
  disabled = false,
  disabledReason,
  onClick,
}: ActionButtonProps) {
  const isBlocked = disabled || Boolean(disabledReason)
  const title = isBlocked && disabledReason ? disabledReason : tooltip
  return (
    <Tooltip title={title}>
      <span>
        <Button
          type="text"
          className={`action-btn action-btn-${tone}`}
          icon={icon}
          aria-label={ariaLabel ?? tooltip}
          disabled={isBlocked}
          onClick={onClick}
        />
      </span>
    </Tooltip>
  )
}

export interface TableActionsProps {
  /** Xem chi tiết */
  onView?: () => void
  viewLabel?: string
  viewAccess?: AccessRule

  /** Thêm mới / thêm liên quan */
  onAdd?: () => void
  addLabel?: string
  addIcon?: ReactNode
  addAccess?: AccessRule
  addDisabled?: boolean
  addDisabledReason?: string

  /** Chỉnh sửa */
  onEdit?: () => void
  editLabel?: string
  editAccess?: AccessRule
  editDisabled?: boolean
  editDisabledReason?: string

  /** Xoá */
  onDelete?: () => void
  deleteLabel?: string
  deleteAccess?: AccessRule
  deleteDisabled?: boolean
  deleteDisabledReason?: string

  /** Tên bản ghi dùng cho tooltip/aria-label (vd: "Nhà hàng Quận 1") */
  recordName?: string

  /** Các nút thao tác tuỳ chỉnh khác */
  extra?: ReactNode
}

/**
 * Component nhóm thao tác dùng chung cho các bảng dữ liệu (Xem, Thêm, Sửa, Xoá).
 * Chuẩn hoá giao diện, icon, tooltip và phân quyền thống nhất toàn hệ thống.
 */
export function TableActions({
  onView,
  viewLabel = 'Xem chi tiết',
  viewAccess,

  onAdd,
  addLabel = 'Thêm',
  addIcon = <PlusCircleOutlined />,
  addAccess,
  addDisabled = false,
  addDisabledReason,

  onEdit,
  editLabel = 'Sửa',
  editAccess,
  editDisabled = false,
  editDisabledReason,

  onDelete,
  deleteLabel = 'Xoá',
  deleteAccess,
  deleteDisabled = false,
  deleteDisabledReason,

  recordName,
  extra,
}: TableActionsProps) {
  const aria = (action: string) => (recordName ? `${action} "${recordName}"` : action)

  return (
    <Space size={6} wrap={false}>
      {onView && (
        viewAccess ? (
          <ProtectedAction access={viewAccess}>
            <ActionButton tone="view" icon={<EyeOutlined />} tooltip={viewLabel} ariaLabel={aria(viewLabel)} onClick={onView} />
          </ProtectedAction>
        ) : (
          <ActionButton tone="view" icon={<EyeOutlined />} tooltip={viewLabel} ariaLabel={aria(viewLabel)} onClick={onView} />
        )
      )}

      {onAdd && (
        addAccess ? (
          <ProtectedAction access={addAccess}>
            <ActionButton tone="add" icon={addIcon} tooltip={addLabel} ariaLabel={aria(addLabel)} disabled={addDisabled} disabledReason={addDisabledReason} onClick={onAdd} />
          </ProtectedAction>
        ) : (
          <ActionButton tone="add" icon={addIcon} tooltip={addLabel} ariaLabel={aria(addLabel)} disabled={addDisabled} disabledReason={addDisabledReason} onClick={onAdd} />
        )
      )}

      {onEdit && (
        editAccess ? (
          <ProtectedAction access={editAccess}>
            <ActionButton tone="edit" icon={<EditOutlined />} tooltip={editLabel} ariaLabel={aria(editLabel)} disabled={editDisabled} disabledReason={editDisabledReason} onClick={onEdit} />
          </ProtectedAction>
        ) : (
          <ActionButton tone="edit" icon={<EditOutlined />} tooltip={editLabel} ariaLabel={aria(editLabel)} disabled={editDisabled} disabledReason={editDisabledReason} onClick={onEdit} />
        )
      )}

      {(onDelete || deleteDisabled || Boolean(deleteDisabledReason)) && (
        deleteAccess ? (
          <ProtectedAction access={deleteAccess}>
            <ActionButton tone="delete" icon={<DeleteOutlined />} tooltip={deleteLabel} ariaLabel={aria(deleteLabel)} disabled={deleteDisabled} disabledReason={deleteDisabledReason} onClick={onDelete} />
          </ProtectedAction>
        ) : (
          <ActionButton tone="delete" icon={<DeleteOutlined />} tooltip={deleteLabel} ariaLabel={aria(deleteLabel)} disabled={deleteDisabled} disabledReason={deleteDisabledReason} onClick={onDelete} />
        )
      )}

      {extra}
    </Space>
  )
}

import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import { Button, Space, Tooltip } from 'antd'
import type { ReactNode } from 'react'
import { ProtectedAction, type AccessRule } from '@/permissions'

export interface TableActionsProps {
  /** Xem chi tiết */
  onView?: () => void
  viewLabel?: string
  viewAccess?: AccessRule

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
 * Component nhóm thao tác dùng chung cho các bảng dữ liệu (Xem chi tiết, Sửa, Xoá).
 * Chuẩn hoá giao diện, icon, tooltip và phân quyền thống nhất toàn hệ thống.
 */
export function TableActions({
  onView,
  viewLabel = 'Xem chi tiết',
  viewAccess,

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

  const isDeleteDisabled = deleteDisabled || Boolean(deleteDisabledReason)
  const isEditDisabled = editDisabled || Boolean(editDisabledReason)

  const editTooltip = isEditDisabled && editDisabledReason ? editDisabledReason : editLabel
  const deleteTooltip = isDeleteDisabled && deleteDisabledReason ? deleteDisabledReason : deleteLabel

  const renderEditBtn = () => (
    <Tooltip title={editTooltip}>
      <span>
        <Button
          type="text"
          icon={<EditOutlined />}
          aria-label={aria(editLabel)}
          disabled={isEditDisabled}
          onClick={onEdit}
        />
      </span>
    </Tooltip>
  )

  const renderDeleteBtn = () => (
    <Tooltip title={deleteTooltip}>
      <span>
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          aria-label={aria(deleteLabel)}
          disabled={isDeleteDisabled}
          onClick={onDelete}
        />
      </span>
    </Tooltip>
  )

  return (
    <Space size={4} wrap={false}>
      {onView &&
        (viewAccess ? (
          <ProtectedAction access={viewAccess}>
            <Tooltip title={viewLabel}>
              <Button type="text" icon={<EyeOutlined />} aria-label={aria(viewLabel)} onClick={onView} />
            </Tooltip>
          </ProtectedAction>
        ) : (
          <Tooltip title={viewLabel}>
            <Button type="text" icon={<EyeOutlined />} aria-label={aria(viewLabel)} onClick={onView} />
          </Tooltip>
        ))}

      {onEdit &&
        (editAccess ? <ProtectedAction access={editAccess}>{renderEditBtn()}</ProtectedAction> : renderEditBtn())}

      {(onDelete || isDeleteDisabled) &&
        (deleteAccess ? (
          <ProtectedAction access={deleteAccess}>{renderDeleteBtn()}</ProtectedAction>
        ) : (
          renderDeleteBtn()
        ))}

      {extra}
    </Space>
  )
}

import { CheckOutlined, LockOutlined, PlusOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'

export interface PermissionToggleCellProps {
  granted: boolean
  /** Có quyền role:manage và ô không bị khoá. */
  editable: boolean
  lockReason?: string | null
  onToggle: () => void
}

/** Một ô của ma trận quyền × vai trò: dấu tích nếu có quyền; bấm để cấp / thu khi được phép sửa. */
export function PermissionToggleCell({ granted, editable, lockReason, onToggle }: PermissionToggleCellProps) {
  const mark = granted ? <CheckOutlined className="perm-cell__check" aria-label="Có quyền" /> : null
  if (lockReason) {
    return (
      <Tooltip title={lockReason}>
        <span className="perm-cell perm-cell--locked">
          {mark}
          <LockOutlined className="perm-cell__lock" />
        </span>
      </Tooltip>
    )
  }
  if (!editable) return <span className="perm-cell">{mark}</span>

  return (
    <Tooltip title={granted ? 'Bấm để thu hồi quyền' : 'Bấm để cấp quyền'} mouseEnterDelay={0.4}>
      <button
        type="button"
        className={`perm-cell perm-cell--editable${granted ? ' perm-cell--granted' : ''}`}
        onClick={onToggle}
        aria-label={granted ? 'Thu hồi quyền' : 'Cấp quyền'}
      >
        {mark ?? <PlusOutlined className="perm-cell__plus" />}
      </button>
    </Tooltip>
  )
}

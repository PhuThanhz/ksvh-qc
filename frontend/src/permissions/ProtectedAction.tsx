import { Tooltip } from 'antd'
import { cloneElement, type ReactElement } from 'react'
import type { AccessRule } from '@/permissions/permissions'
import { usePermission } from '@/permissions/usePermission'

export interface ProtectedActionProps {
  access: AccessRule
  /** hide: ẩn hẳn (mặc định). disable: vẫn hiện nhưng khoá, có tooltip giải thích. */
  mode?: 'hide' | 'disable'
  children: ReactElement<{ disabled?: boolean }>
}

/** Bọc một nút/hành động cần quyền. */
export function ProtectedAction({ access, mode = 'hide', children }: ProtectedActionProps) {
  const { allows } = usePermission()
  if (allows(access)) return children
  if (mode === 'hide') return null
  return (
    <Tooltip title="Bạn không có quyền thực hiện thao tác này">
      <span>{cloneElement(children, { disabled: true })}</span>
    </Tooltip>
  )
}

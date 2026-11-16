import type { ReactNode } from 'react'
import type { AccessRule } from '@/permissions'

/** Một mục menu. Mục không đủ quyền (access) sẽ tự ẩn. */
export interface MenuEntry {
  path: string
  label: string
  icon?: ReactNode
  access?: AccessRule
  /** Tên nhóm trong sidebar (vd "Quản trị hệ thống"); các mục cùng nhóm gom thành menu con. */
  group?: string
  /** Icon của nhóm (lấy từ mục đầu tiên trong nhóm). */
  groupIcon?: ReactNode
}

export interface LayoutUser {
  fullName: string
  roles: readonly string[]
}

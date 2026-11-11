import type { ReactNode } from 'react'
import type { AccessRule } from '@/permissions'

/** Một mục menu. Mục không đủ quyền (access) sẽ tự ẩn. */
export interface MenuEntry {
  path: string
  label: string
  icon?: ReactNode
  access?: AccessRule
}

export interface LayoutUser {
  fullName: string
  roles: readonly string[]
}

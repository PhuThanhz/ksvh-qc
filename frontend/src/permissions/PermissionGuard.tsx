import type { ReactNode } from 'react'
import type { AccessRule } from '@/permissions/permissions'
import { usePermission } from '@/permissions/usePermission'

export interface PermissionGuardProps {
  access: AccessRule
  /** Hiển thị khi không đủ quyền. Mặc định không hiển thị gì. */
  fallback?: ReactNode
  children: ReactNode
}

/** Ẩn/hiện một vùng giao diện theo quyền. Backend vẫn phải kiểm tra quyền ở API. */
export function PermissionGuard({ access, fallback = null, children }: PermissionGuardProps) {
  const { allows } = usePermission()
  return <>{allows(access) ? children : fallback}</>
}

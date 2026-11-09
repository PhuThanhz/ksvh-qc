import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import type { Role } from '@/api/types'
import { homePathFor, useAuthStore } from '@/features/auth/authStore'

/**
 * Chặn trang khi chưa đăng nhập hoặc không đúng vai trò. Backend vẫn kiểm tra quyền lần nữa.
 * Không truyền children thì render route con (Outlet).
 */
export function RequireAuth({ roles, children }: { roles?: Role[]; children?: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(user.role)) return <Navigate to={homePathFor(user)} replace />
  return children ?? <Outlet />
}

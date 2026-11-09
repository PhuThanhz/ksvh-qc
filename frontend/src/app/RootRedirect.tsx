import { Navigate } from 'react-router'
import { homePathFor, useAuthStore } from '@/features/auth/authStore'

/** Chuyển về trang chính theo vai trò (hoặc trang đăng nhập). */
export function RootRedirect() {
  const user = useAuthStore((s) => s.user)
  return <Navigate to={homePathFor(user)} replace />
}

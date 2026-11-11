import { Navigate, Outlet, useLocation, useMatches } from 'react-router'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ROUTES } from '@/constants/routes'
import { useSession } from '@/features/auth'
import { getHomePath, satisfies, type AccessRule } from '@/permissions'
import type { RouteHandle } from '@/types/route.types'
import { safeRedirectPath } from '@/utils/safe-redirect'

/**
 * Bảo vệ khu vực cần đăng nhập. Kiểm tra:
 * 1. đã đăng nhập (chưa → /login?redirect=...),
 * 2. quyền vào khu vực (access),
 * 3. quyền của MỌI route đang khớp (handle.access).
 * Đây chỉ là trải nghiệm; backend vẫn kiểm tra quyền ở từng API.
 */
export function ProtectedRoute({ access }: { access?: AccessRule }) {
  const { status, user } = useSession()
  const location = useLocation()
  const matches = useMatches()

  if (status === 'bootstrapping') return <LoadingState fullScreen tip="Đang kiểm tra phiên đăng nhập…" />
  if (status === 'anonymous' || !user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`${ROUTES.login}?redirect=${redirect}`} replace />
  }
  if (!satisfies(user, access)) return <Navigate to={getHomePath(user)} replace />

  const denied = matches.some((m) => !satisfies(user, (m.handle as RouteHandle | undefined)?.access))
  if (denied) return <ErrorState kind={403} />
  return <Outlet />
}

/** Trang chỉ dành cho người chưa đăng nhập (login). Đã đăng nhập → về trang chủ hoặc ?redirect. */
export function GuestRoute() {
  const { status, user } = useSession()
  const location = useLocation()

  if (status === 'bootstrapping') return <LoadingState fullScreen />
  if (status === 'authenticated' && user) {
    const redirect = safeRedirectPath(new URLSearchParams(location.search).get('redirect'))
    return <Navigate to={redirect ?? getHomePath(user)} replace />
  }
  return <Outlet />
}

/** "/" → trang chủ theo quyền. */
export function HomeRedirect() {
  const { status, user } = useSession()
  if (status === 'bootstrapping') return <LoadingState fullScreen />
  return <Navigate to={user ? getHomePath(user) : ROUTES.login} replace />
}

import { selectStatus, selectUser, useSessionStore } from '@/features/auth/store/session.store'

/** Đọc phiên hiện tại trong component. */
export function useSession() {
  const user = useSessionStore(selectUser)
  const status = useSessionStore(selectStatus)
  const endReason = useSessionStore((s) => s.endReason)
  return { user, status, endReason, isAuthenticated: status === 'authenticated' }
}

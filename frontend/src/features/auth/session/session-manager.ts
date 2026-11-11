import { authApi } from '@/features/auth/api/auth.api'
import type { SessionResponse } from '@/features/auth/auth.types'
import { authChannel } from '@/features/auth/session/auth-channel'
import { useSessionStore } from '@/features/auth/store/session.store'
import { toApiError } from '@/lib/http'

const REFRESH_LOCK = 'ksvh-auth-refresh'

let inFlight: Promise<string | null> | null = null

/** Đăng nhập/làm mới thành công: cập nhật tab này và báo các tab khác. */
export function applySession(session: SessionResponse) {
  useSessionStore.getState().setSession(session)
  authChannel.post({ type: 'SESSION_UPDATED', session })
}

/** Kết thúc phiên ở tab này và mọi tab khác. */
export function endSession(reason: 'logout' | 'expired') {
  useSessionStore.getState().endSession(reason)
  authChannel.post({ type: 'LOGGED_OUT', reason })
}

/**
 * Làm mới access token an toàn khi nhiều request / nhiều tab cùng hết hạn:
 * 1. Trong một tab: gộp mọi lời gọi đồng thời vào một Promise (single-flight).
 * 2. Giữa các tab: Web Locks đảm bảo chỉ một tab gọi /auth/refresh tại một thời điểm.
 *    Tab chờ lock xong thấy token đã được tab khác làm mới (qua BroadcastChannel) thì dùng luôn.
 * Trả null nếu phiên đã hết (401). Lỗi mạng được ném ra, KHÔNG đăng xuất người dùng.
 */
export function refreshSession(): Promise<string | null> {
  inFlight ??= runExclusive().finally(() => {
    inFlight = null
  })
  return inFlight
}

async function runExclusive(): Promise<string | null> {
  const tokenBefore = useSessionStore.getState().accessToken
  const task = () => doRefresh(tokenBefore)
  return 'locks' in navigator ? navigator.locks.request(REFRESH_LOCK, task) : task()
}

async function doRefresh(tokenBefore: string | null): Promise<string | null> {
  const current = useSessionStore.getState().accessToken
  if (current && current !== tokenBefore) return current // tab khác vừa làm mới xong

  try {
    const session = await authApi.refresh()
    applySession(session)
    return session.accessToken
  } catch (err) {
    const apiErr = toApiError(err)
    if (apiErr.status === 401 || apiErr.status === 403) {
      const wasAuthenticated = useSessionStore.getState().status === 'authenticated'
      endSession(wasAuthenticated ? 'expired' : 'logout')
      return null
    }
    throw apiErr
  }
}

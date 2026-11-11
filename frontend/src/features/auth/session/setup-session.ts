import type { QueryClient } from '@tanstack/react-query'
import { authChannel } from '@/features/auth/session/auth-channel'
import { refreshSession } from '@/features/auth/session/session-manager'
import { useSessionStore } from '@/features/auth/store/session.store'
import { configureHttpAuth } from '@/lib/http'

const LEGACY_STORAGE_KEY = 'ksvh-auth'

/**
 * Gọi một lần trong main.tsx, trước khi render:
 * - nối HTTP client với phiên đăng nhập (gắn token, tự làm mới khi 401),
 * - lắng nghe đăng nhập/đăng xuất từ các tab khác,
 * - xoá cache dữ liệu khi phiên kết thúc để người dùng sau không thấy dữ liệu người trước.
 */
export function setupSession(queryClient: QueryClient) {
  // Bản cũ lưu token trong localStorage (khoá 'ksvh-auth'); xoá để không còn token nằm lại trên máy.
  localStorage.removeItem(LEGACY_STORAGE_KEY)

  configureHttpAuth({
    getAccessToken: () => useSessionStore.getState().accessToken,
    refreshAccessToken: refreshSession,
  })

  authChannel.subscribe((message) => {
    const store = useSessionStore.getState()
    if (message.type === 'SESSION_UPDATED') {
      const switchedUser = store.user && store.user.id !== message.session.user.id
      if (switchedUser) queryClient.clear()
      store.setSession(message.session)
    } else {
      store.endSession(message.reason)
    }
  })

  useSessionStore.subscribe((state, prev) => {
    if (prev.status === 'authenticated' && state.status === 'anonymous') queryClient.clear()
  })
}

/** Khôi phục phiên khi mở app bằng cookie refresh. Lỗi mạng được ném ra để màn khởi động hiện nút thử lại. */
export async function bootstrapSession(): Promise<void> {
  const token = await refreshSession()
  if (!token && useSessionStore.getState().status === 'bootstrapping') {
    useSessionStore.getState().endSession('logout')
  }
}

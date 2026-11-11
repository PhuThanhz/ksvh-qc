import { api } from '@/lib/http'
import type { LoginRequest, SessionResponse, SessionUser } from '@/types/api.generated'

const PATH = {
  login: '/auth/login',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  me: '/auth/me',
} as const

export const authApi = {
  login: (body: LoginRequest) => api.post<SessionResponse>(PATH.login, body).then((r) => r.data),
  /** Cookie refresh token (HttpOnly) tự đi kèm; không có body. */
  refresh: () => api.post<SessionResponse>(PATH.refresh).then((r) => r.data),
  logout: () => api.post<void>(PATH.logout).then(() => undefined),
  me: () => api.get<SessionUser>(PATH.me).then((r) => r.data),
}

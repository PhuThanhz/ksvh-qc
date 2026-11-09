import { http } from '@/api/http'
import type { TokenResponse, UserInfo } from '@/api/types'

export const authApi = {
  login: (username: string, password: string) =>
    http.post<TokenResponse>('/auth/login', { username, password }).then((r) => r.data),
  me: () => http.get<UserInfo>('/auth/me').then((r) => r.data),
}

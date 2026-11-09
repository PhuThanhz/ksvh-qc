import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ProblemDetail, TokenResponse } from '@/api/types'
import { useAuthStore } from '@/features/auth/authStore'

export const http = axios.create({ baseURL: '/api', timeout: 20_000 })

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Gộp nhiều request 401 cùng lúc vào một lần refresh.
let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setSession, logout } = useAuthStore.getState()
  if (!refreshToken) return null
  try {
    const { data } = await axios.post<TokenResponse>('/api/auth/refresh', { refreshToken })
    setSession(data)
    return data.accessToken
  } catch {
    logout()
    return null
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
    const isAuthCall = original?.url?.startsWith('/auth/')
    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null
      })
      const token = await refreshing
      if (token) {
        original.headers.Authorization = `Bearer ${token}`
        return http(original)
      }
    }
    return Promise.reject(error)
  },
)

/** Lấy câu thông báo lỗi dễ đọc từ lỗi axios. */
export function errorMessage(err: unknown, fallback = 'Có lỗi xảy ra, vui lòng thử lại'): string {
  if (axios.isAxiosError<ProblemDetail>(err)) {
    if (!err.response) return 'Không kết nối được máy chủ'
    return err.response.data?.detail ?? fallback
  }
  return err instanceof Error ? err.message : fallback
}

import axios from 'axios'
import { HTTP_TIMEOUT_MS } from '@/constants/app.constants'
import { env } from '@/lib/env'
import { installInterceptors } from '@/lib/http/api.interceptor'
import type { HttpAuthHooks } from '@/lib/http/api.types'

/**
 * HTTP client dùng chung. Chỉ các file *.api.ts trong features được import.
 * withCredentials để cookie refresh token (HttpOnly) đi kèm request /auth/*.
 * X-Requested-With là điều kiện chống CSRF của backend cho refresh/logout.
 */
export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: HTTP_TIMEOUT_MS,
  withCredentials: true,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
})

let uninstall: (() => void) | null = null

/** Gọi một lần khi khởi động (features/auth/session/setup-session.ts). */
export function configureHttpAuth(hooks: HttpAuthHooks) {
  uninstall?.()
  uninstall = installInterceptors(api, hooks)
}

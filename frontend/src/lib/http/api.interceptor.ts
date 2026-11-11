import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { toApiError } from '@/lib/http/api-error'
import type { HttpAuthHooks } from '@/lib/http/api.types'

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

/** Request tới các endpoint này không bao giờ kích hoạt refresh (tránh vòng lặp vô hạn). */
const AUTH_ENDPOINT = /\/auth\/(login|refresh|logout)$/

/**
 * - Gắn access token vào mọi request.
 * - 401 → làm mới token (refreshAccessToken tự gộp các lần gọi đồng thời) → phát lại request đúng 1 lần.
 * - Mọi lỗi được chuẩn hoá thành ApiError.
 */
export function installInterceptors(instance: AxiosInstance, hooks: HttpAuthHooks): () => void {
  const req = instance.interceptors.request.use((config) => {
    // Endpoint xác thực dùng cookie; gửi kèm access token đã hết hạn sẽ bị backend từ chối 401.
    const token = AUTH_ENDPOINT.test(config.url ?? '') ? null : hooks.getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  const res = instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as RetriableConfig | undefined
      const shouldRefresh =
        error.response?.status === 401 && config && !config._retried && !AUTH_ENDPOINT.test(config.url ?? '')

      if (shouldRefresh) {
        config._retried = true
        const token = await hooks.refreshAccessToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          return instance(config)
        }
      }
      return Promise.reject(toApiError(error))
    },
  )

  return () => {
    instance.interceptors.request.eject(req)
    instance.interceptors.response.eject(res)
  }
}

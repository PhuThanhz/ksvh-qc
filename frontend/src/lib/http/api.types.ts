/** Body lỗi chuẩn của backend: ProblemDetail (RFC 9457) + code + errors + traceId. */
export interface ApiErrorBody {
  status: number
  title?: string
  detail?: string
  code?: string
  errors?: Record<string, string>
  traceId?: string
}

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'canceled'

/** Callback xác thực do feature auth cung cấp; lib/http không phụ thuộc feature nào. */
export interface HttpAuthHooks {
  getAccessToken: () => string | null
  /** Làm mới access token. Trả null nếu phiên đã hết (đã đăng xuất). */
  refreshAccessToken: () => Promise<string | null>
}

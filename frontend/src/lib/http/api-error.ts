import axios from 'axios'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import type { ApiErrorBody, ApiErrorKind } from '@/lib/http/api.types'

const MESSAGES: Record<Exclude<ApiErrorKind, 'http'>, string> = {
  network: 'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.',
  timeout: 'Máy chủ phản hồi quá lâu, vui lòng thử lại.',
  canceled: 'Yêu cầu đã bị huỷ.',
}

/** Lỗi API đã chuẩn hoá. Component chỉ làm việc với ApiError, không đụng tới AxiosError. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number
  readonly code: string | undefined
  readonly fieldErrors: Record<string, string>
  readonly traceId: string | undefined

  constructor(kind: ApiErrorKind, message: string, body?: ApiErrorBody) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = body?.status ?? 0
    this.code = body?.code
    this.fieldErrors = body?.errors ?? {}
    this.traceId = body?.traceId
  }

  get isUnauthorized() {
    return this.status === 401
  }

  get isClientError() {
    return this.status >= 400 && this.status < 500
  }
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err
  if (axios.isCancel(err)) return new ApiError('canceled', MESSAGES.canceled)
  if (axios.isAxiosError<ApiErrorBody>(err)) {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') return new ApiError('timeout', MESSAGES.timeout)
    if (!err.response) return new ApiError('network', MESSAGES.network)
    const body = err.response.data ?? { status: err.response.status }
    const status = body.status ?? err.response.status
    return new ApiError('http', body.detail ?? defaultHttpMessage(status), { ...body, status })
  }
  return new ApiError('http', err instanceof Error ? err.message : 'Có lỗi xảy ra')
}

/** Câu thông báo hiển thị được cho mọi loại lỗi. */
export function getErrorMessage(err: unknown): string {
  return toApiError(err).message
}

/** Đổ lỗi theo trường từ server (400 VALIDATION_FAILED) vào react-hook-form. Trả true nếu có. */
export function applyFieldErrors<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>): boolean {
  const { fieldErrors } = toApiError(err)
  const entries = Object.entries(fieldErrors)
  entries.forEach(([field, message]) => setError(field as Path<T>, { type: 'server', message }))
  return entries.length > 0
}

function defaultHttpMessage(status: number): string {
  if (status === 401) return 'Bạn cần đăng nhập để tiếp tục'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này'
  if (status === 404) return 'Không tìm thấy dữ liệu'
  if (status >= 500) return 'Hệ thống gặp sự cố, vui lòng thử lại sau'
  return 'Yêu cầu không hợp lệ'
}

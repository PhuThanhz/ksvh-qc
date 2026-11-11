import { QueryClient } from '@tanstack/react-query'
import { QUERY_MAX_RETRIES } from '@/constants/app.constants'
import { toApiError } from '@/lib/http'

/** Không thử lại lỗi 4xx (sai dữ liệu, không có quyền...); chỉ thử lại lỗi mạng/5xx. */
function shouldRetry(failureCount: number, error: unknown) {
  const err = toApiError(error)
  if (err.kind === 'canceled' || err.isClientError) return false
  return failureCount < QUERY_MAX_RETRIES
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, refetchOnWindowFocus: false, staleTime: 30_000 },
      mutations: { retry: false },
    },
  })
}

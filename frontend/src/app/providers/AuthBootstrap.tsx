import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ErrorState } from '@/components/feedback/ErrorState'
import { bootstrapSession } from '@/features/auth'
import { getErrorMessage } from '@/lib/http'

/**
 * Khi mở app: khôi phục phiên bằng cookie refresh (access token không được lưu lại).
 * Trong lúc chờ, các route guard hiện màn tải. Mất mạng thì hiện nút thử lại thay vì đá về trang đăng nhập.
 */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null)

  const start = useCallback(() => {
    bootstrapSession().catch((e: unknown) => setError(getErrorMessage(e)))
  }, [])

  useEffect(start, [start])

  const retry = () => {
    setError(null)
    start()
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <ErrorState title="Không khởi động được ứng dụng" description={error} onRetry={retry} />
      </div>
    )
  }
  return children
}

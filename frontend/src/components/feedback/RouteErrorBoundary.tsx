import { isRouteErrorResponse, useRouteError } from 'react-router'
import { ErrorState } from '@/components/feedback/ErrorState'

/** errorElement cho route: bắt lỗi render/tải chunk để không trắng màn hình. */
export function RouteErrorBoundary() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <ErrorState kind={404} />
  return <ErrorState kind={500} onRetry={() => window.location.reload()} />
}

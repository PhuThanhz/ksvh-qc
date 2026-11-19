import type { RouteObject } from 'react-router'

const IDLE_TIMEOUT_MS = 2000

/**
 * Tải sẵn code của các trang (route `lazy`) khi trình duyệt rảnh, để bấm menu chuyển trang ngay
 * mà không phải chờ tải file JS. Chỉ tải module, không chạy loader / gọi API.
 */
export function prefetchRouteChunks(routes: readonly RouteObject[]): () => void {
  const load = (list: readonly RouteObject[]) => {
    for (const r of list) {
      if (typeof r.lazy === 'function') void Promise.resolve(r.lazy()).catch(() => undefined)
      if (r.children) load(r.children)
    }
  }
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(() => load(routes), { timeout: IDLE_TIMEOUT_MS })
    return () => window.cancelIdleCallback(id)
  }
  const id = window.setTimeout(() => load(routes), IDLE_TIMEOUT_MS)
  return () => window.clearTimeout(id)
}

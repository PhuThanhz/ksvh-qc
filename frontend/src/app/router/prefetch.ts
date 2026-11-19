import type { RouteObject } from 'react-router'

const IDLE_TIMEOUT_MS = 2500
const CHUNK_GAP_MS = 180

/**
 * Tải sẵn code của các trang (route `lazy`) tuần tự từng chunk khi trình duyệt rảnh,
 * tránh bắn đồng thời 17 request tải JS làm nghẽn băng thông và luồng chính.
 */
export function prefetchRouteChunks(routes: readonly RouteObject[]): () => void {
  const queue: Array<() => unknown> = []
  const collect = (list: readonly RouteObject[]) => {
    for (const r of list) {
      if (typeof r.lazy === 'function') queue.push(r.lazy as () => unknown)
      if (r.children) collect(r.children)
    }
  }
  collect(routes)

  let cancelled = false
  let timerId: number | undefined
  let idleId: number | undefined

  const scheduleNext = (delay: number) => {
    if (cancelled || queue.length === 0) return
    timerId = window.setTimeout(() => {
      if (cancelled || queue.length === 0) return
      const run = () => {
        if (cancelled) return
        const nextLazy = queue.shift()
        if (nextLazy) {
          void Promise.resolve(nextLazy()).catch(() => undefined)
        }
        scheduleNext(CHUNK_GAP_MS)
      }
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS })
      } else {
        run()
      }
    }, delay)
  }

  scheduleNext(IDLE_TIMEOUT_MS)

  return () => {
    cancelled = true
    if (timerId !== undefined) window.clearTimeout(timerId)
    if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(idleId)
    }
  }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { GPS_MAX_ACCURACY_M, GPS_TIMEOUT_MS } from '@/constants/app.constants'

export interface GeoFix {
  lat: number
  lng: number
  /** Sai số ước tính (mét). Càng nhỏ càng chính xác. */
  accuracy: number
  timestamp: number
}

export type GeoStatus = 'idle' | 'locating' | 'ready' | 'weak' | 'denied' | 'unavailable' | 'insecure'

interface Options {
  /** Sai số tối đa chấp nhận được (mét). */
  maxAccuracy?: number
  /** Thời gian dò tối đa (ms). */
  timeoutMs?: number
}

/**
 * Lấy vị trí GPS ổn định: theo dõi liên tục trong một khoảng thời gian và giữ lại
 * lần đo có sai số nhỏ nhất. Dừng sớm khi đạt ngưỡng maxAccuracy.
 * Lưu ý: server vẫn phải tự kiểm tra khoảng cách tới điểm chấm.
 */
export function useGeolocation({ maxAccuracy = GPS_MAX_ACCURACY_M, timeoutMs = GPS_TIMEOUT_MS }: Options = {}) {
  const [status, setStatus] = useState<GeoStatus>('idle')
  const [fix, setFix] = useState<GeoFix | null>(null)
  const [error, setError] = useState<string | null>(null)
  const watchId = useRef<number | null>(null)
  const timer = useRef<number | null>(null)
  const best = useRef<GeoFix | null>(null)

  const stop = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    if (timer.current !== null) window.clearTimeout(timer.current)
    watchId.current = null
    timer.current = null
  }, [])

  const locate = useCallback(() => {
    stop()
    setError(null)
    best.current = null
    setFix(null)

    if (!window.isSecureContext) {
      setStatus('insecure')
      setError('Trang phải chạy qua HTTPS thì mới lấy được vị trí')
      return
    }
    if (!('geolocation' in navigator)) {
      setStatus('unavailable')
      setError('Thiết bị không hỗ trợ định vị')
      return
    }

    setStatus('locating')
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const next: GeoFix = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        }
        if (!best.current || next.accuracy < best.current.accuracy) {
          best.current = next
          setFix(next)
        }
        if (next.accuracy <= maxAccuracy) {
          stop()
          setStatus('ready')
        }
      },
      (err) => {
        stop()
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied')
          setError('Bạn đã chặn quyền vị trí. Hãy bật lại trong cài đặt trình duyệt.')
        } else {
          setStatus(best.current ? 'weak' : 'unavailable')
          setError('Không dò được vị trí. Hãy ra chỗ thoáng và thử lại.')
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs },
    )

    timer.current = window.setTimeout(() => {
      stop()
      if (!best.current) {
        setStatus('unavailable')
        setError('Hết thời gian dò vị trí')
      } else {
        setStatus(best.current.accuracy <= maxAccuracy ? 'ready' : 'weak')
      }
    }, timeoutMs)
  }, [maxAccuracy, timeoutMs, stop])

  useEffect(() => stop, [stop])

  return { status, fix, error, locate }
}

import { useEffect, useState } from 'react'

/** Trả về giá trị sau khi ngừng thay đổi `delayMs` (dùng cho ô tìm kiếm). */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

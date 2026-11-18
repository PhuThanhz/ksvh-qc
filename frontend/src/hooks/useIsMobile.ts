import { Grid } from 'antd'

/**
 * Hook kiểm tra màn hình nhỏ (< 768px - md breakpoint của antd).
 * Dùng để chuyển đổi giữa giao diện bảng desktop và dạng thẻ trên điện thoại.
 */
export function useIsMobile(): boolean {
  const screens = Grid.useBreakpoint()

  if (screens.md !== undefined) {
    return !screens.md
  }

  if (typeof window !== 'undefined') {
    return window.innerWidth < 768
  }

  return false
}

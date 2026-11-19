import { createContext, useContext, useLayoutEffect, type ReactNode } from 'react'

interface PageActionsContextValue {
  /** Nút hành động của trang (Thêm, Nhập/Xuất Excel…). */
  actions: ReactNode
  /** Thanh lọc báo "tôi sẽ hiện nút hành động"; trả hàm huỷ khi thanh lọc gỡ khỏi trang. */
  claim: () => () => void
}

export const PageActionsContext = createContext<PageActionsContextValue | null>(null)

/**
 * Dùng trong thanh lọc (AdvancedFilter): nhận nút hành động của trang để hiện ở góc phải hàng tìm kiếm,
 * đồng thời báo PageContainer không vẽ chúng trên đầu trang nữa. Đăng ký trước khi vẽ để không nháy.
 */
export function usePageActionsSlot(): ReactNode {
  const ctx = useContext(PageActionsContext)
  const claim = ctx?.claim
  useLayoutEffect(() => (claim ? claim() : undefined), [claim])
  return ctx?.actions ?? null
}

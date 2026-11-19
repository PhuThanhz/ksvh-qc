import type { CSSProperties, ReactNode } from 'react'

export interface TableCardProps {
  children: ReactNode
  style?: CSSProperties
}

/**
 * Khối chứa bảng dữ liệu, tách riêng với khối bộ lọc (AdvancedFilter).
 * Dùng cho mọi bảng: DataTable (phân trang server) tự bọc sẵn; bảng antd thường thì bọc bằng component này.
 */
export function TableCard({ children, style }: TableCardProps) {
  return (
    // Bảng tràn sát mép khung (không lề trong) để không lộ viền trắng quanh tiêu đề bảng; lề phân trang đặt ở CSS .table-card.
    <div className="glass-panel table-card" style={{ padding: 0, overflow: 'hidden', ...style }}>
      {children}
    </div>
  )
}

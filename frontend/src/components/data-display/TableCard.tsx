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
    <div className="glass-panel" style={{ padding: '6px 14px 14px', overflow: 'hidden', ...style }}>
      {children}
    </div>
  )
}

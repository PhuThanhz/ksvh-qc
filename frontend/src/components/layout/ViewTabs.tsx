import { Tabs } from 'antd'
import type { ReactNode } from 'react'

export interface ViewTabItem {
  key: string
  label: ReactNode
  icon?: ReactNode
  /** Số đếm hiển thị bên cạnh nhãn (bỏ trống = không hiện). */
  count?: number
  /** Màu chấm trạng thái trực quan (vd: '#22c55e', '#ef4444'...). */
  color?: string
}

export interface ViewTabsProps {
  items: ViewTabItem[]
  activeKey: string
  onChange: (key: string) => void
}

/**
 * Thanh tab chuyển chế độ xem của danh sách (theo trạng thái, theo loại…).
 * Chuẩn toàn hệ thống: đặt ngay dưới thanh tìm kiếm / bộ lọc, ngay trên bảng; không khung bao.
 */
export function ViewTabs({ items, activeKey, onChange }: ViewTabsProps) {
  return (
    <Tabs
      className="tabs-plain view-tabs"
      activeKey={activeKey}
      onChange={onChange}
      items={items.map((t) => ({
        key: t.key,
        icon: t.icon,
        label: (
          <span className="view-tabs__label">
            {t.color && (
              <span
                className="view-tabs__dot"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: t.color,
                  display: 'inline-block',
                  flexShrink: 0,
                  boxShadow: `0 0 6px ${t.color}88`,
                }}
              />
            )}
            <span>{t.label}</span>
            {t.count != null && <span className="view-tabs__count">{t.count}</span>}
          </span>
        ),
      }))}
    />
  )
}

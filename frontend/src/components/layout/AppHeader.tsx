import { Flex } from 'antd'
import { useState } from 'react'
import { SidebarToggleButton } from '@/components/layout/SidebarToggleButton'
import { NotificationBell } from '@/features/notifications'

const DATE_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export interface AppHeaderProps {
  collapsed?: boolean
  onToggleSidebar?: () => void
}

/** Thanh trên cùng: nút thu gọn sidebar (trái), ngày hôm nay và chuông thông báo (phải). Tên trang hiện ở tiêu đề trang. */
export function AppHeader({ collapsed, onToggleSidebar }: AppHeaderProps) {
  const [todayString] = useState(() => DATE_FORMATTER.format(new Date()))

  return (
    <Flex align="center" justify="space-between" style={{ height: '100%', width: '100%' }}>
      <Flex align="center">
        {onToggleSidebar && <SidebarToggleButton collapsed={collapsed} onClick={onToggleSidebar} />}
      </Flex>

      <Flex align="center" gap={14}>
        <span style={{ color: 'rgba(255, 255, 255, 0.82)', fontSize: 13, whiteSpace: 'nowrap' }}>
          {todayString}
        </span>
        <NotificationBell />
      </Flex>
    </Flex>
  )
}

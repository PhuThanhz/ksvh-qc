import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Button, Flex } from 'antd'
import { useState } from 'react'
import { useLocation } from 'react-router'
import type { MenuEntry } from '@/components/layout/menu.types'
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
  menu?: readonly MenuEntry[]
}

export function AppHeader({ collapsed, onToggleSidebar, menu }: AppHeaderProps) {
  const { pathname } = useLocation()
  const [todayString] = useState(() => DATE_FORMATTER.format(new Date()))

  const activeEntry = menu
    ?.filter((m) => pathname === m.path || pathname.startsWith(`${m.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]

  return (
    <Flex align="center" justify="space-between" style={{ height: '100%', width: '100%' }}>
      <Flex align="center" gap={12} style={{ minWidth: 0, overflow: 'hidden' }}>
        {onToggleSidebar && (
          <Button
            type="text"
            className="glass-pill-btn"
            icon={
              collapsed ? (
                <MenuUnfoldOutlined style={{ color: '#ffffff', fontSize: 16 }} />
              ) : (
                <MenuFoldOutlined style={{ color: '#ffffff', fontSize: 16 }} />
              )
            }
            onClick={onToggleSidebar}
            aria-label={collapsed ? 'Mở thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              flexShrink: 0,
            }}
          />
        )}

        {activeEntry && (
          <Flex align="center" gap={6} style={{ fontSize: 13.5, userSelect: 'none', minWidth: 0, overflow: 'hidden' }}>
            {activeEntry.group && (
              <span className="app-header-breadcrumb-group" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.72)', fontWeight: 500 }}>{activeEntry.group}</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>/</span>
              </span>
            )}
            <span
              style={{
                color: '#ffffff',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeEntry.label}
            </span>
          </Flex>
        )}
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

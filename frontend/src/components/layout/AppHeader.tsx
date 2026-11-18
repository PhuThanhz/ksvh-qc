import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Button, Flex } from 'antd'
import { useLocation } from 'react-router'
import type { MenuEntry } from '@/components/layout/menu.types'
import { NotificationBell } from '@/features/notifications'

export interface AppHeaderProps {
  collapsed?: boolean
  onToggleSidebar?: () => void
  menu?: readonly MenuEntry[]
}

export function AppHeader({ collapsed, onToggleSidebar, menu }: AppHeaderProps) {
  const { pathname } = useLocation()

  const activeEntry = menu
    ?.filter((m) => pathname === m.path || pathname.startsWith(`${m.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]

  return (
    <Flex align="center" justify="space-between" style={{ height: '100%', width: '100%' }}>
      <Flex align="center" gap={12} style={{ minWidth: 0, overflow: 'hidden' }}>
        {onToggleSidebar && (
          <Button
            type="text"
            icon={
              collapsed ? (
                <MenuUnfoldOutlined style={{ color: 'var(--app-on-dark)', fontSize: 16 }} />
              ) : (
                <MenuFoldOutlined style={{ color: 'var(--app-on-dark)', fontSize: 16 }} />
              )
            }
            onClick={onToggleSidebar}
            aria-label={collapsed ? 'Mở thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              flexShrink: 0,
            }}
          />
        )}

        {activeEntry && (
          <Flex align="center" gap={6} style={{ fontSize: 13.5, userSelect: 'none', minWidth: 0, overflow: 'hidden' }}>
            {activeEntry.group && (
              <span className="app-header-breadcrumb-group" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ color: 'var(--app-on-dark-secondary)', fontWeight: 500 }}>{activeEntry.group}</span>
                <span style={{ color: 'var(--app-on-dark-faint)' }}>/</span>
              </span>
            )}
            <span
              style={{
                color: 'var(--app-on-dark)',
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

      <Flex align="center" gap={10}>
        <NotificationBell />
      </Flex>
    </Flex>
  )
}

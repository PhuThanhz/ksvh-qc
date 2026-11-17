import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Button, Flex } from 'antd'
import { useLocation } from 'react-router'
import type { MenuEntry } from '@/components/layout/menu.types'
import { CreateMenu } from '@/features/dashboard/components/CreateMenu'
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
      <Flex align="center" gap={12}>
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
              background: 'var(--app-on-dark-glass)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--app-on-dark-glass-border)',
            }}
          />
        )}

        {activeEntry && (
          <Flex align="center" gap={6} style={{ fontSize: 13.5, userSelect: 'none' }}>
            {activeEntry.group && (
              <>
                <span style={{ color: 'var(--app-on-dark-secondary)', fontWeight: 500 }}>{activeEntry.group}</span>
                <span style={{ color: 'var(--app-on-dark-faint)' }}>/</span>
              </>
            )}
            <span style={{ color: 'var(--app-on-dark)', fontWeight: 600 }}>
              {activeEntry.label}
            </span>
          </Flex>
        )}
      </Flex>

      <Flex align="center" gap={10}>
        <NotificationBell />
        <CreateMenu />
      </Flex>
    </Flex>
  )
}

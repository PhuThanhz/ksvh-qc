import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Button, Flex } from 'antd'
import { useLocation } from 'react-router'
import type { MenuEntry } from '@/components/layout/menu.types'

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
                <MenuUnfoldOutlined style={{ color: '#1d1d1f', fontSize: 16 }} />
              ) : (
                <MenuFoldOutlined style={{ color: '#1d1d1f', fontSize: 16 }} />
              )
            }
            onClick={onToggleSidebar}
            aria-label={collapsed ? 'Mở thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.7)',
            }}
          />
        )}

        {activeEntry && (
          <Flex align="center" gap={6} style={{ fontSize: 13.5, userSelect: 'none' }}>
            {activeEntry.group && (
              <>
                <span style={{ color: 'rgba(29, 29, 31, 0.65)', fontWeight: 500 }}>{activeEntry.group}</span>
                <span style={{ color: 'rgba(29, 29, 31, 0.35)' }}>/</span>
              </>
            )}
            <span style={{ color: '#1d1d1f', fontWeight: 600 }}>
              {activeEntry.label}
            </span>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

import {
  BgColorsOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Button, Flex, Tooltip } from 'antd'
import { useLocation } from 'react-router'
import type { MenuEntry } from '@/components/layout/menu.types'

export interface AppHeaderProps {
  collapsed?: boolean
  onToggleSidebar?: () => void
  menu?: readonly MenuEntry[]
  onOpenTheme?: () => void
}

export function AppHeader({ collapsed, onToggleSidebar, menu, onOpenTheme }: AppHeaderProps) {
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
                <MenuUnfoldOutlined style={{ color: '#475569', fontSize: 16 }} />
              ) : (
                <MenuFoldOutlined style={{ color: '#475569', fontSize: 16 }} />
              )
            }
            onClick={onToggleSidebar}
            aria-label={collapsed ? 'Mở thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          />
        )}

        {activeEntry && (
          <Flex align="center" gap={6} style={{ fontSize: 13.5, userSelect: 'none' }}>
            {activeEntry.group && (
              <>
                <span style={{ color: '#64748b', fontWeight: 500 }}>{activeEntry.group}</span>
                <span style={{ color: '#cbd5e1' }}>/</span>
              </>
            )}
            <span style={{ color: '#0f172a', fontWeight: 600 }}>
              {activeEntry.label}
            </span>
          </Flex>
        )}
      </Flex>

      {onOpenTheme && (
        <Tooltip title="Đổi chủ đề / hình nền giao diện">
          <Button
            type="text"
            icon={<BgColorsOutlined style={{ color: '#0284c7', fontSize: 15 }} />}
            onClick={onOpenTheme}
            aria-label="Đổi hình nền giao diện"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 32,
              borderRadius: 6,
              paddingInline: 10,
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              color: '#0369a1',
              fontWeight: 500,
              fontSize: 12.5,
            }}
          >
            Đổi hình nền
          </Button>
        </Tooltip>
      )}
    </Flex>
  )
}

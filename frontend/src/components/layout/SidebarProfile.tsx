import {
  BgColorsOutlined,
  DownOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Dropdown, Flex, Tag, Tooltip, Typography, type MenuProps } from 'antd'
import { lazy, Suspense, useState } from 'react'
import type { LayoutUser } from '@/components/layout/menu.types'
import { roleLabel } from '@/permissions'

const ThemeModal = lazy(() => import('@/features/theme').then((m) => ({ default: m.ThemeModal })))

export interface SidebarProfileProps {
  user: LayoutUser | null
  onLogout: () => void
  loggingOut?: boolean
  collapsed: boolean
}

function initialsOf(fullName?: string): string {
  if (!fullName) return 'U'
  const parts = fullName.trim().split(/\s+/)
  const last = parts[parts.length - 1]
  return (last?.[0] ?? 'U').toUpperCase()
}

export function SidebarProfile({ user, onLogout, loggingOut, collapsed }: SidebarProfileProps) {
  const [themeOpen, setThemeOpen] = useState(false)

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'profile-info',
      disabled: true,
      style: { cursor: 'default', opacity: 1 },
      label: (
        <Flex vertical gap={4} style={{ paddingBlock: 2 }}>
          <Typography.Text strong>{user?.fullName ?? 'Người dùng'}</Typography.Text>
          <Flex gap={4} wrap>
            {user?.roles.map((r) => (
              <Tag key={r} style={{ margin: 0, borderRadius: 4, background: 'var(--app-surface-sunken)', color: 'var(--app-text-body)', border: '1px solid var(--app-border)' }}>
                {roleLabel(r)}
              </Tag>
            ))}
          </Flex>
        </Flex>
      ),
    },
    { type: 'divider' },
    {
      key: 'theme',
      icon: <BgColorsOutlined />,
      label: 'Đổi chủ đề / hình nền',
      onClick: () => setThemeOpen(true),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất',
      danger: true,
      disabled: loggingOut,
      onClick: onLogout,
    },
  ]

  const avatar = (
    <Avatar
      size={collapsed ? 36 : 34}
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        color: 'var(--app-text)',
        fontWeight: 700,
        fontSize: 14,
        flexShrink: 0,
        border: '1px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
      }}
    >
      {initialsOf(user?.fullName)}
    </Avatar>
  )

  return (
    <div
      style={{
        padding: collapsed ? '12px 0' : '10px 12px',
        borderTop: '1px solid var(--app-on-dark-border)',
        marginTop: 'auto',
        background: 'transparent',
      }}
    >
      <Dropdown menu={{ items: dropdownItems }} trigger={['click']} placement="topRight">
        {collapsed ? (
          <Tooltip title={user?.fullName ?? 'Tài khoản'} placement="right">
            <Flex justify="center" style={{ cursor: 'pointer' }}>
              {avatar}
            </Flex>
          </Tooltip>
        ) : (
          <Button
            type="text"
            block
            style={{
              height: 'auto',
              padding: '6px 8px',
              borderRadius: 8,
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Flex align="center" gap={10} style={{ width: '100%', overflow: 'hidden' }}>
              {avatar}
              <Flex vertical style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
                <Typography.Text strong ellipsis style={{ fontSize: 13, color: 'var(--app-on-dark)' }}>
                  {user?.fullName ?? 'Người dùng'}
                </Typography.Text>
                <Typography.Text ellipsis style={{ fontSize: 11, color: 'var(--app-on-dark-secondary)' }}>
                  {user?.roles.map(roleLabel).join(', ')}
                </Typography.Text>
              </Flex>
              <DownOutlined style={{ fontSize: 10, color: 'var(--app-on-dark-muted)', flexShrink: 0 }} />
            </Flex>
          </Button>
        )}
      </Dropdown>
      {themeOpen && (
        <Suspense fallback={null}>
          <ThemeModal open={themeOpen} onClose={() => setThemeOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}

import {
  BgColorsOutlined,
  DownOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Dropdown, Flex, Tag, Tooltip, Typography, type MenuProps } from 'antd'
import { useState } from 'react'
import type { LayoutUser } from '@/components/layout/menu.types'
import { ThemeModal } from '@/features/theme'
import { roleLabel } from '@/permissions'

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
              <Tag key={r} style={{ margin: 0, borderRadius: 4, background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }}>
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
      size={collapsed ? 36 : 32}
      style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        color: '#ffffff',
        fontWeight: 700,
        fontSize: 13,
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
      }}
    >
      {initialsOf(user?.fullName)}
    </Avatar>
  )

  return (
    <div
      style={{
        padding: collapsed ? '12px 0' : '8px 10px',
        borderTop: '1px solid #1e293b',
        marginTop: 'auto',
        background: '#0f172a',
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
                <Typography.Text strong ellipsis style={{ fontSize: 13, color: '#f8fafc' }}>
                  {user?.fullName ?? 'Người dùng'}
                </Typography.Text>
                <Typography.Text ellipsis style={{ fontSize: 11, color: '#94a3b8' }}>
                  {user?.roles.map(roleLabel).join(', ')}
                </Typography.Text>
              </Flex>
              <DownOutlined style={{ fontSize: 10, color: '#64748b', flexShrink: 0 }} />
            </Flex>
          </Button>
        )}
      </Dropdown>
      <ThemeModal open={themeOpen} onClose={() => setThemeOpen(false)} />
    </div>
  )
}

import {
  BgColorsOutlined,
  DownOutlined,
  LogoutOutlined,
  MobileOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Dropdown, Flex, Tag, Tooltip, Typography, type MenuProps } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { LayoutUser } from '@/components/layout/menu.types'
import { ROUTES } from '@/constants/routes'
import { ThemeModal } from '@/features/theme'
import { AREA_ACCESS, roleLabel, usePermission } from '@/permissions'

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
  const navigate = useNavigate()
  const { allows } = usePermission()
  const canAccessQc = allows(AREA_ACCESS.qc)

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
              <Tag key={r} style={{ margin: 0, borderRadius: 4, background: 'rgba(0, 0, 0, 0.05)', color: '#3a3a3c', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
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
      label: 'Đổi hình nền giao diện',
      onClick: () => setThemeOpen(true),
    },
    ...(canAccessQc
      ? [
          {
            key: 'switch-qc',
            icon: <MobileOutlined />,
            label: 'Giao diện chấm QC Mobile (/qc)',
            onClick: () => navigate(ROUTES.qc.root),
          },
        ]
      : []),
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
        background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
        color: '#1d1d1f',
        fontWeight: 700,
        fontSize: 14,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.9)',
      }}
    >
      {initialsOf(user?.fullName)}
    </Avatar>
  )

  return (
    <div
      style={{
        padding: collapsed ? '12px 0' : '10px 12px',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
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
              <Flex vertical style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
                <Typography.Text strong ellipsis style={{ fontSize: 13, color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)' }}>
                  {user?.fullName ?? 'Người dùng'}
                </Typography.Text>
                <Typography.Text ellipsis style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>
                  {user?.roles.map(roleLabel).join(', ')}
                </Typography.Text>
              </Flex>
              <DownOutlined style={{ fontSize: 10, color: '#ffffff', flexShrink: 0 }} />
            </Flex>
          </Button>
        )}
      </Dropdown>
      <ThemeModal open={themeOpen} onClose={() => setThemeOpen(false)} />
    </div>
  )
}

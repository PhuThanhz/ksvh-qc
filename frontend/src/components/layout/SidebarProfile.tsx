import {
  BgColorsOutlined,
  DownOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Dropdown, Flex, Tooltip, Typography, type MenuProps } from 'antd'
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

function getPrimaryRoleLabel(roles?: readonly string[]): string {
  if (!roles || roles.length === 0) return 'Người dùng'
  if (roles.includes('SYSTEM_ADMIN')) return 'Quản trị hệ thống'
  if (roles.includes('BUSINESS_ADMIN')) return 'Quản trị nghiệp vụ'
  if (roles.includes('EXECUTIVE')) return 'Ban Giám đốc'
  if (roles.includes('KSVH_MANAGER') || roles.includes('KSVH_LEAD')) return 'Quản lý KSVH'
  if (roles.includes('QC_INSPECTOR')) return 'Chuyên viên QC'
  if (roles.includes('STORE_MANAGER')) return 'Cửa hàng trưởng'
  return roleLabel(roles[0]!)
}

export function SidebarProfile({ user, onLogout, loggingOut, collapsed }: SidebarProfileProps) {
  const [themeOpen, setThemeOpen] = useState(false)

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'profile-info',
      disabled: true,
      style: { cursor: 'default', opacity: 1 },
      label: (
        <Flex vertical gap={2} style={{ padding: '4px 2px', maxWidth: 260 }}>
          <Typography.Text strong style={{ fontSize: 13.5, color: '#0f172a' }}>
            {user?.fullName ?? 'Người dùng'}
          </Typography.Text>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 12, lineHeight: 1.4, color: '#64748b' }}
          >
            {getPrimaryRoleLabel(user?.roles)}
          </Typography.Text>
        </Flex>
      ),
    },
    { type: 'divider' },
    {
      key: 'theme',
      icon: <BgColorsOutlined />,
      label: 'Đổi chủ đề / giao diện',
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
        background: '#eff6ff',
        color: '#2563eb',
        fontWeight: 700,
        fontSize: 14,
        flexShrink: 0,
        border: '1px solid #dbeafe',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      {initialsOf(user?.fullName)}
    </Avatar>
  )

  return (
    <div
      style={{
        padding: collapsed ? '12px 0' : '10px 12px',
        borderTop: '1px solid var(--app-border)',
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
            className="glass-profile-card"
            style={{
              height: 'auto',
              padding: '8px 10px',
              borderRadius: 12,
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Flex align="center" gap={10} style={{ width: '100%', overflow: 'hidden' }}>
              {avatar}
              <Flex vertical style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
                <Typography.Text strong ellipsis style={{ fontSize: 13, color: '#0f172a' }}>
                  {user?.fullName ?? 'Người dùng'}
                </Typography.Text>
                <Typography.Text ellipsis style={{ fontSize: 11, color: '#64748b' }}>
                  {getPrimaryRoleLabel(user?.roles)}
                </Typography.Text>
              </Flex>
              <DownOutlined style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }} />
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

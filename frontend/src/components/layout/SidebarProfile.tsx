import {
  BgColorsOutlined,
  DownOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { Avatar, Dropdown, Flex, Tooltip, Typography, type MenuProps } from 'antd'
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

function cleanDisplayName(fullName?: string): string {
  if (!fullName) return 'Người dùng'
  // Loại bỏ các hậu tố ngoặc đơn chức vụ nếu có ví dụ: "Nguyễn Hoàng Minh (Quản trị Hệ thống)" -> "Nguyễn Hoàng Minh"
  return fullName.replace(/\s*\([^)]*\)/g, '').trim() || fullName
}

function initialsOf(fullName?: string): string {
  const clean = cleanDisplayName(fullName)
  if (!clean) return 'U'
  const parts = clean.trim().split(/\s+/)
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
            {cleanDisplayName(user?.fullName)}
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
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Avatar
        size={collapsed ? 34 : 36}
        style={{
          background: 'rgba(255, 255, 255, 0.22)',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: 14,
          flexShrink: 0,
          border: '1px solid rgba(255, 255, 255, 0.35)',
        }}
      >
        {initialsOf(user?.fullName)}
      </Avatar>
      <span
        style={{
          position: 'absolute',
          right: -1,
          bottom: -1,
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: '#10b981',
          border: '2px solid rgba(15, 23, 42, 0.8)',
        }}
        aria-label="Đang trực tuyến"
      />
    </div>
  )

  return (
    <div
      style={{
        padding: collapsed ? '10px 8px 12px' : '10px 10px 12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        marginTop: 'auto',
        background: 'transparent',
      }}
    >
      <Dropdown menu={{ items: dropdownItems }} trigger={['click']} placement="topRight">
        {collapsed ? (
          <Tooltip title={cleanDisplayName(user?.fullName)} placement="right">
            <Flex justify="center" style={{ cursor: 'pointer' }}>
              {avatar}
            </Flex>
          </Tooltip>
        ) : (
          <button
            type="button"
            className="sidebar-account-card"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.18)',
              background: 'rgba(255, 255, 255, 0.14)',
              boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
          >
            {avatar}
            <Flex vertical style={{ flex: 1, minWidth: 0, lineHeight: 1.25, gap: 2 }}>
              <Flex align="center" gap={6}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 650,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.35)',
                  }}
                  title={cleanDisplayName(user?.fullName)}
                >
                  {cleanDisplayName(user?.fullName)}
                </span>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: 'rgba(255, 255, 255, 0.22)',
                    color: '#ffffff',
                    lineHeight: 1.2,
                    flexShrink: 0,
                  }}
                >
                  {user?.roles?.includes('SYSTEM_ADMIN') ? 'Admin' : 'QC'}
                </span>
              </Flex>
              <span
                style={{
                  fontSize: 11.5,
                  color: 'rgba(255, 255, 255, 0.78)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {getPrimaryRoleLabel(user?.roles)}
              </span>
            </Flex>
            <DownOutlined style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.65)', flexShrink: 0 }} />
          </button>
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

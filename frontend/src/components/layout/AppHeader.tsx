import {
  DownOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MobileOutlined,
} from '@ant-design/icons'
import { Avatar, Breadcrumb, Button, Dropdown, Flex, Tag, Typography, theme, type MenuProps } from 'antd'
import { useLocation, useNavigate } from 'react-router'
import type { LayoutUser, MenuEntry } from '@/components/layout/menu.types'
import { ROUTES } from '@/constants/routes'
import { AREA_ACCESS, roleLabel, usePermission } from '@/permissions'

export interface AppHeaderProps {
  user: LayoutUser | null
  onLogout: () => void
  loggingOut?: boolean
  menu?: readonly MenuEntry[]
  collapsed?: boolean
  onToggleSidebar?: () => void
}

function initialsOf(fullName?: string): string {
  if (!fullName) return 'U'
  const parts = fullName.trim().split(/\s+/)
  const last = parts[parts.length - 1]
  return (last?.[0] ?? 'U').toUpperCase()
}

export function AppHeader({ user, onLogout, loggingOut, menu = [], collapsed, onToggleSidebar }: AppHeaderProps) {
  const { token } = theme.useToken()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { allows } = usePermission()

  const currentMenu = [...menu]
    .filter((m) => pathname === m.path || pathname.startsWith(`${m.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]

  const canAccessQc = allows(AREA_ACCESS.qc)

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'profile-summary',
      disabled: true,
      style: { cursor: 'default', opacity: 1 },
      label: (
        <Flex vertical gap={4} style={{ paddingBlock: 2 }}>
          <Typography.Text strong>{user?.fullName ?? 'Người dùng'}</Typography.Text>
          <Flex gap={4} wrap>
            {user?.roles.map((r) => (
              <Tag key={r} color="blue" style={{ margin: 0 }}>
                {roleLabel(r)}
              </Tag>
            ))}
          </Flex>
        </Flex>
      ),
    },
    { type: 'divider' },
    ...(canAccessQc
      ? [
          {
            key: 'switch-qc',
            icon: <MobileOutlined />,
            label: 'Giao diện chấm QC (/qc)',
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

  return (
    <Flex align="center" justify="space-between" gap={12} style={{ height: '100%' }}>
      <Flex align="center" gap={12} style={{ minWidth: 0 }}>
        {onToggleSidebar && (
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggleSidebar}
            aria-label={collapsed ? 'Mở thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            style={{ width: 36, height: 36, fontSize: 16 }}
          />
        )}
        <Breadcrumb
          items={[
            {
              title: (
                <Typography.Text
                  type="secondary"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(ROUTES.admin.root)}
                >
                  Quản trị
                </Typography.Text>
              ),
            },
            ...(currentMenu
              ? [
                  {
                    title: (
                      <Flex align="center" gap={6}>
                        {currentMenu.icon}
                        <span>{currentMenu.label}</span>
                      </Flex>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Flex>

      <Dropdown menu={{ items: dropdownItems }} trigger={['click']} placement="bottomRight">
        <Button
          type="text"
          style={{
            height: 44,
            paddingInline: 10,
            borderRadius: token.borderRadiusLG,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Flex align="center" gap={10}>
            <Avatar
              size={28}
              style={{
                backgroundColor: token.colorPrimaryBg,
                color: token.colorPrimary,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {initialsOf(user?.fullName)}
            </Avatar>
            <Flex vertical align="flex-start" style={{ lineHeight: 1.2 }}>
              <Typography.Text strong style={{ fontSize: 13 }}>
                {user?.fullName}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {user?.roles.map(roleLabel).join(', ')}
              </Typography.Text>
            </Flex>
            <DownOutlined style={{ fontSize: 11, color: token.colorTextTertiary }} />
          </Flex>
        </Button>
      </Dropdown>
    </Flex>
  )
}

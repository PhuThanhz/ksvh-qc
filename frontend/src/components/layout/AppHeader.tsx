import {
  BgColorsOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MobileOutlined,
} from '@ant-design/icons'
import { Button, Flex, Tooltip } from 'antd'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { MenuEntry } from '@/components/layout/menu.types'
import { ROUTES } from '@/constants/routes'
import { ThemeModal } from '@/features/theme'
import { AREA_ACCESS, usePermission } from '@/permissions'

export interface AppHeaderProps {
  collapsed?: boolean
  onToggleSidebar?: () => void
  menu?: readonly MenuEntry[]
}

export function AppHeader({ collapsed, onToggleSidebar, menu }: AppHeaderProps) {
  const [themeOpen, setThemeOpen] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { allows } = usePermission()
  const canAccessQc = allows(AREA_ACCESS.qc)

  const activeEntry = menu
    ?.filter((m) => pathname === m.path || pathname.startsWith(`${m.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]

  return (
    <>
      <Flex align="center" justify="space-between" style={{ height: '100%', width: '100%' }}>
        <Flex align="center" gap={12}>
          {onToggleSidebar && (
            <Button
              type="text"
              icon={
                collapsed ? (
                  <MenuUnfoldOutlined style={{ color: '#ffffff', fontSize: 16 }} />
                ) : (
                  <MenuFoldOutlined style={{ color: '#ffffff', fontSize: 16 }} />
                )
              }
              onClick={onToggleSidebar}
              aria-label={collapsed ? 'Mở thanh điều hướng' : 'Thu gọn thanh điều hướng'}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
              }}
            />
          )}

          {activeEntry && (
            <Flex align="center" gap={6} style={{ fontSize: 13, userSelect: 'none' }}>
              {activeEntry.group && (
                <>
                  <span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>{activeEntry.group}</span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}>/</span>
                </>
              )}
              <span style={{ color: '#ffffff', fontWeight: 600, textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>
                {activeEntry.label}
              </span>
            </Flex>
          )}
        </Flex>

        <Flex align="center" gap={10}>
          <Tooltip title="Đổi hình nền giao diện">
            <Button
              type="text"
              icon={<BgColorsOutlined style={{ fontSize: 16, color: '#ffffff' }} />}
              onClick={() => setThemeOpen(true)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
              }}
            />
          </Tooltip>

          {canAccessQc && (
            <Button
              type="text"
              size="small"
              icon={<MobileOutlined style={{ color: '#ffffff' }} />}
              style={{
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 500,
                height: 32,
                color: '#ffffff',
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
              }}
              onClick={() => navigate(ROUTES.qc.root)}
            >
              Chấm QC Mobile
            </Button>
          )}
        </Flex>
      </Flex>

      <ThemeModal open={themeOpen} onClose={() => setThemeOpen(false)} />
    </>
  )
}

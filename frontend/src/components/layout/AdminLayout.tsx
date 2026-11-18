import { CloseOutlined, SafetyCertificateFilled } from '@ant-design/icons'
import { Button, Drawer, Flex, Grid, Layout, Typography } from 'antd'
import { Suspense, useState } from 'react'
import { Outlet } from 'react-router'
import { ContentErrorBoundary } from '@/components/feedback/ContentErrorBoundary'
import { LoadingState } from '@/components/feedback/LoadingState'
import { AmbientCanvas } from '@/components/layout/AmbientCanvas'
import { AppHeader } from '@/components/layout/AppHeader'
import type { LayoutUser, MenuEntry } from '@/components/layout/menu.types'
import { Sidebar } from '@/components/layout/Sidebar'
import { SidebarProfile } from '@/components/layout/SidebarProfile'

export interface AdminLayoutProps {
  menu: readonly MenuEntry[]
  user: LayoutUser | null
  onLogout: () => void
  loggingOut?: boolean
}

function BrandHeader({
  collapsed,
  borderColor,
  onClose,
}: {
  collapsed: boolean
  borderColor: string
  onClose?: () => void
}) {
  return (
    <Flex
      align="center"
      justify={collapsed ? 'center' : 'space-between'}
      style={{
        height: 56,
        paddingInline: collapsed ? 0 : 16,
        borderBottom: `1px solid ${borderColor}`,
        flexShrink: 0,
      }}
    >
      <Flex align="center" gap={12}>
        <Flex
          align="center"
          justify="center"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.16)',
            color: '#ffffff',
            fontSize: 18,
            flexShrink: 0,
            border: '1px solid rgba(255, 255, 255, 0.28)',
            boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.35), 0 6px 16px -6px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <SafetyCertificateFilled />
        </Flex>
        {!collapsed && (
          <Flex vertical style={{ lineHeight: 1.15, overflow: 'hidden' }}>
            <Typography.Text
              strong
              style={{
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#ffffff',
                textTransform: 'uppercase',
              }}
            >
              KSVH QC
            </Typography.Text>
            <Typography.Text
              style={{
                fontSize: 9.5,
                fontWeight: 500,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.7)',
                whiteSpace: 'nowrap',
              }}
            >
              Kiểm soát vận hành
            </Typography.Text>
          </Flex>
        )}
      </Flex>
      {onClose && (
        <Button
          type="text"
          shape="circle"
          icon={<CloseOutlined style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: 16 }} />}
          onClick={onClose}
          aria-label="Đóng thanh điều hướng"
        />
      )}
    </Flex>
  )
}

/** Khung dashboard chuẩn Hub Shopee / Apple: Header & Sidebar kính mờ trong suốt, thẻ nội dung trắng nổi bật. */
export function AdminLayout({ menu, user, onLogout, loggingOut }: AdminLayoutProps) {
  const screens = Grid.useBreakpoint()
  const isDesktop = screens.lg ?? true

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleToggle = () => {
    if (isDesktop) {
      setCollapsed((c) => !c)
    } else {
      setMobileOpen((o) => !o)
    }
  }

  return (
    <Layout className="app-shell app-shell--themed app-shell--tone-dark" style={{ minHeight: '100vh', background: 'transparent', position: 'relative' }}>
      <AmbientCanvas />
      {isDesktop ? (
        <Layout.Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          theme="dark"
          width={264}
          collapsedWidth={72}
          className="app-sidebar"
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
          }}
        >
          <Flex vertical style={{ height: '100%', overflow: 'hidden' }}>
            <BrandHeader collapsed={collapsed} borderColor="rgba(255, 255, 255, 0.12)" />
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <Sidebar menu={menu} />
            </div>
            <SidebarProfile
              user={user}
              onLogout={onLogout}
              loggingOut={loggingOut}
              collapsed={collapsed}
            />
          </Flex>
        </Layout.Sider>
      ) : (
        <Drawer
          placement="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          size={280}
          closable={false}
          className="app-sidebar mobile-navigation"
          styles={{ body: { padding: 0 } }}
        >
          <Flex vertical style={{ height: '100%' }}>
            <BrandHeader collapsed={false} borderColor="rgba(255, 255, 255, 0.12)" onClose={() => setMobileOpen(false)} />
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <Sidebar menu={menu} onSelect={() => setMobileOpen(false)} />
            </div>
            <SidebarProfile
              user={user}
              onLogout={onLogout}
              loggingOut={loggingOut}
              collapsed={false}
            />
          </Flex>
        </Drawer>
      )}

      <Layout className="app-main" style={{ minWidth: 0, background: 'transparent', position: 'relative', zIndex: 1 }}>
        <Layout.Header
          className="topbar"
          style={{
            paddingInline: isDesktop ? 20 : 16,
            height: 52,
            lineHeight: '52px',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <AppHeader onToggleSidebar={handleToggle} collapsed={collapsed} menu={menu} />
        </Layout.Header>

        <Layout.Content
          className="app-content"
          style={{
            padding: isDesktop ? '20px 24px 32px' : '16px',
            minHeight: 'calc(100vh - 52px)',
          }}
        >
          <ContentErrorBoundary>
            <Suspense fallback={<LoadingState />}>
              <Outlet />
            </Suspense>
          </ContentErrorBoundary>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}

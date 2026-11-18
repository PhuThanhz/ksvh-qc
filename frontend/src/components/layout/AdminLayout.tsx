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
            width: 32,
            height: 32,
            borderRadius: 8,
            background: '#eff6ff',
            color: '#2563eb',
            fontSize: 18,
            flexShrink: 0,
            border: '1px solid #dbeafe',
          }}
        >
          <SafetyCertificateFilled />
        </Flex>
        {!collapsed && (
          <Flex vertical style={{ lineHeight: 1.2, overflow: 'hidden' }}>
            <Typography.Text strong style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.2, color: '#0f172a' }}>
              KSVH QC
            </Typography.Text>
            <Typography.Text style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#64748b' }}>
              Kiểm soát vận hành
            </Typography.Text>
          </Flex>
        )}
      </Flex>
      {onClose && (
        <Button
          type="text"
          shape="circle"
          icon={<CloseOutlined style={{ color: '#64748b', fontSize: 16 }} />}
          onClick={onClose}
          aria-label="Đóng thanh điều hướng"
        />
      )}
    </Flex>
  )
}

/** Khung dashboard máy tính: sidebar thu gọn được + drawer trên màn nhỏ + header cố định. */
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
    <Layout style={{ minHeight: '100vh', background: '#f8fafc', position: 'relative' }}>
      <AmbientCanvas />
      {isDesktop ? (
        <Layout.Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          theme="light"
          width={280}
          collapsedWidth={76}
          className="apple-frosted-sidebar"
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
            <BrandHeader collapsed={collapsed} borderColor="var(--app-border)" />
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
          className="apple-frosted-sidebar"
          styles={{ body: { padding: 0 } }}
        >
          <Flex vertical style={{ height: '100%' }}>
            <BrandHeader collapsed={false} borderColor="var(--app-border)" onClose={() => setMobileOpen(false)} />
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

      <Layout style={{ minWidth: 0, background: 'transparent', position: 'relative', zIndex: 1 }}>
        <Layout.Header
          className="apple-frosted-header"
          style={{
            paddingInline: isDesktop ? 20 : 16,
            height: 52,
            lineHeight: '52px',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <AppHeader onToggleSidebar={handleToggle} isDesktop={isDesktop} />
        </Layout.Header>

        <Layout.Content
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

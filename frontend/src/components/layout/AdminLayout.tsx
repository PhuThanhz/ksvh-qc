import { SafetyCertificateFilled } from '@ant-design/icons'
import { Drawer, Flex, Grid, Layout, Tag, Typography } from 'antd'
import { Suspense, useState } from 'react'
import { Outlet } from 'react-router'
import { LoadingState } from '@/components/feedback/LoadingState'
import { AppHeader } from '@/components/layout/AppHeader'
import type { LayoutUser, MenuEntry } from '@/components/layout/menu.types'
import { Sidebar } from '@/components/layout/Sidebar'
import { SidebarProfile } from '@/components/layout/SidebarProfile'
import { AmbientCanvas } from '@/components/layout/AmbientCanvas'

export interface AdminLayoutProps {
  menu: readonly MenuEntry[]
  user: LayoutUser | null
  onLogout: () => void
  loggingOut?: boolean
}

function BrandHeader({ collapsed, borderColor }: { collapsed: boolean; borderColor: string }) {
  return (
    <Flex
      align="center"
      justify={collapsed ? 'center' : 'flex-start'}
      gap={12}
      style={{
        height: 60,
        paddingInline: collapsed ? 0 : 20,
        borderBottom: `1px solid ${borderColor}`,
        flexShrink: 0,
      }}
    >
      <Flex
        align="center"
        justify="center"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'rgba(0, 113, 227, 0.1)',
          color: '#0071e3',
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        <SafetyCertificateFilled />
      </Flex>
      {!collapsed && (
        <Flex vertical style={{ lineHeight: 1.2, overflow: 'hidden' }}>
          <Flex align="center" gap={6}>
            <Typography.Text strong style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.2, color: '#ffffff', textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)' }}>
              KSVH QC
            </Typography.Text>
            <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0, borderRadius: 4, background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', border: 'none' }}>
              PRO
            </Tag>
          </Flex>
          <Typography.Text style={{ fontSize: 11, whiteSpace: 'nowrap', color: 'rgba(255, 255, 255, 0.8)', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>
            Kiểm soát vận hành
          </Typography.Text>
        </Flex>
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
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
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
          }}
        >
          <Flex vertical style={{ height: '100%', overflow: 'hidden' }}>
            <BrandHeader collapsed={collapsed} borderColor="rgba(0, 0, 0, 0.06)" />
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
            <BrandHeader collapsed={false} borderColor="rgba(0, 0, 0, 0.06)" />
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

      <Layout style={{ minWidth: 0, background: 'transparent' }}>
        <Layout.Header
          className="apple-frosted-header"
          style={{
            paddingInline: isDesktop ? 20 : 16,
            height: 48,
            lineHeight: '48px',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <AppHeader
            collapsed={isDesktop ? collapsed : !mobileOpen}
            onToggleSidebar={handleToggle}
            menu={menu}
          />
        </Layout.Header>
        <Layout.Content style={{ padding: isDesktop ? '14px 20px 24px' : '10px 12px 18px' }}>
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}

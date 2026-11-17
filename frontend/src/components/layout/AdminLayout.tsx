import { SafetyCertificateFilled } from '@ant-design/icons'
import { Drawer, Flex, Grid, Layout, Tag, Typography } from 'antd'
import { Suspense, useState } from 'react'
import { Outlet } from 'react-router'
import { LoadingState } from '@/components/feedback/LoadingState'
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

function BrandHeader({ collapsed }: { collapsed: boolean }) {
  return (
    <Flex
      align="center"
      justify={collapsed ? 'center' : 'flex-start'}
      gap={12}
      style={{
        height: 54,
        paddingInline: collapsed ? 0 : 18,
        borderBottom: '1px solid #1e293b',
        flexShrink: 0,
        background: '#0f172a',
      }}
    >
      <Flex
        align="center"
        justify="center"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          fontSize: 17,
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)',
        }}
      >
        <SafetyCertificateFilled />
      </Flex>
      {!collapsed && (
        <Flex vertical style={{ lineHeight: 1.2, overflow: 'hidden' }}>
          <Flex align="center" gap={6}>
            <Typography.Text strong style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2, color: '#f8fafc' }}>
              KSVH QC
            </Typography.Text>
            <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0, borderRadius: 4, background: 'rgba(2, 132, 199, 0.2)', color: '#38bdf8', border: '1px solid rgba(2, 132, 199, 0.3)' }}>
              PRO
            </Tag>
          </Flex>
          <Typography.Text style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#94a3b8' }}>
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
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {isDesktop ? (
        <Layout.Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          theme="dark"
          width={260}
          collapsedWidth={72}
          className="enterprise-dark-sidebar"
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#0f172a',
            borderRight: '1px solid #1e293b',
            zIndex: 100,
          }}
        >
          <Flex vertical style={{ height: '100%', overflow: 'hidden' }}>
            <BrandHeader collapsed={collapsed} />
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
          size={260}
          closable={false}
          className="enterprise-dark-sidebar"
          styles={{ body: { padding: 0, background: '#0f172a' } }}
        >
          <Flex vertical style={{ height: '100%' }}>
            <BrandHeader collapsed={false} />
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

      <Layout style={{ minWidth: 0, background: '#f8fafc' }}>
        <Layout.Header
          style={{
            paddingInline: isDesktop ? 24 : 16,
            height: 52,
            lineHeight: '52px',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
          }}
        >
          <AppHeader
            collapsed={isDesktop ? collapsed : !mobileOpen}
            onToggleSidebar={handleToggle}
            menu={menu}
          />
        </Layout.Header>
        <Layout.Content style={{ padding: isDesktop ? '16px 24px 28px' : '12px 14px 20px' }}>
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}

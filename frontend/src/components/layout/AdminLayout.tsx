import { SafetyCertificateFilled } from '@ant-design/icons'
import { Drawer, Flex, Grid, Layout, Typography, theme } from 'antd'
import { Suspense, useState } from 'react'
import { Outlet } from 'react-router'
import { LoadingState } from '@/components/feedback/LoadingState'
import { AppHeader, type AppHeaderProps } from '@/components/layout/AppHeader'
import type { MenuEntry } from '@/components/layout/menu.types'
import { Sidebar } from '@/components/layout/Sidebar'

export interface AdminLayoutProps extends Omit<AppHeaderProps, 'menu' | 'collapsed' | 'onToggleSidebar'> {
  menu: readonly MenuEntry[]
}

function BrandHeader({ collapsed, borderColor, primaryColor }: { collapsed: boolean; borderColor: string; primaryColor: string }) {
  return (
    <Flex
      align="center"
      justify={collapsed ? 'center' : 'flex-start'}
      gap={10}
      style={{
        height: 64,
        paddingInline: collapsed ? 0 : 20,
        borderBottom: `1px solid ${borderColor}`,
        flexShrink: 0,
      }}
    >
      <Flex
        align="center"
        justify="center"
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: primaryColor,
          color: '#fff',
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        <SafetyCertificateFilled />
      </Flex>
      {!collapsed && (
        <Flex vertical style={{ lineHeight: 1.15, overflow: 'hidden' }}>
          <Typography.Text strong style={{ fontSize: 15, whiteSpace: 'nowrap' }}>
            KSVH QC
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
            Kiểm soát vận hành
          </Typography.Text>
        </Flex>
      )}
    </Flex>
  )
}

/** Khung dashboard máy tính: sidebar thu gọn được + drawer trên màn nhỏ + header cố định. */
export function AdminLayout({ menu, ...header }: AdminLayoutProps) {
  const { token } = theme.useToken()
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
    <Layout style={{ minHeight: '100vh' }}>
      {isDesktop ? (
        <Layout.Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          theme="light"
          width={236}
          collapsedWidth={76}
          style={{
            borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <BrandHeader collapsed={collapsed} borderColor={token.colorBorderSecondary} primaryColor={token.colorPrimary} />
          <Sidebar menu={menu} />
        </Layout.Sider>
      ) : (
        <Drawer
          placement="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          width={248}
          closable={false}
          styles={{ body: { padding: 0 } }}
        >
          <BrandHeader collapsed={false} borderColor={token.colorBorderSecondary} primaryColor={token.colorPrimary} />
          <Sidebar menu={menu} onSelect={() => setMobileOpen(false)} />
        </Drawer>
      )}

      <Layout style={{ minWidth: 0 }}>
        <Layout.Header
          style={{
            background: '#fff',
            paddingInline: isDesktop ? 24 : 16,
            height: 64,
            lineHeight: '64px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <AppHeader
            {...header}
            menu={menu}
            collapsed={isDesktop ? collapsed : !mobileOpen}
            onToggleSidebar={handleToggle}
          />
        </Layout.Header>
        <Layout.Content style={{ padding: isDesktop ? 24 : 16 }}>
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}

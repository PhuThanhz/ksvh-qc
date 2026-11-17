import { NavBar, SafeArea, TabBar } from 'antd-mobile'
import { Suspense, useEffect, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { LoadingState } from '@/components/feedback/LoadingState'
import type { MenuEntry } from '@/components/layout/menu.types'
import { usePermission } from '@/permissions'

export interface MobileLayoutProps {
  title: string
  rootPath: string
  tabs: readonly MenuEntry[]
  headerRight?: ReactNode
}

/** Khung giao diện điện thoại: thanh tiêu đề + tab dưới đáy, thao tác một tay, tránh tai thỏ/thanh home. */
export function MobileLayout({ title, rootPath, tabs, headerRight }: MobileLayoutProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { allows } = usePermission()
  const visibleTabs = tabs.filter((t) => allows(t.access))
  const active = visibleTabs.find((t) => t.path === pathname)?.path ?? rootPath
  const activeLabel = visibleTabs.find((t) => t.path === active)?.label

  useEffect(() => {
    document.title = activeLabel ? `${activeLabel} · ${title}` : title
  }, [activeLabel, title])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--app-chrome-solid)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--app-surface)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
          position: 'relative',
        }}
      >
        <SafeArea position="top" />
        <NavBar backIcon={pathname !== rootPath} onBack={() => navigate(-1)} right={headerRight}>
          {title}
        </NavBar>
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--app-surface-sunken)' }}>
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
        </main>
        {visibleTabs.length > 1 && (
          <TabBar activeKey={active} onChange={(key) => navigate(key)}>
            {visibleTabs.map((t) => (
              <TabBar.Item key={t.path} icon={t.icon} title={t.label} />
            ))}
          </TabBar>
        )}
        <SafeArea position="bottom" />
      </div>
    </div>
  )
}

import { AlertOutlined, BellOutlined, CheckSquareOutlined, UserOutlined } from '@ant-design/icons'
import { Badge, Drawer } from 'antd'
import { ActionSheet, TabBar } from 'antd-mobile'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams, type RouteObject } from 'react-router'
import { prefetchRouteChunks } from '@/app/router/prefetch'
import { AdminLayout } from '@/components/layout/AdminLayout'
import type { MenuEntry } from '@/components/layout/menu.types'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { ROUTES } from '@/constants/routes'
import { useLogout, useSession } from '@/features/auth'
import { NotificationBell } from '@/features/notifications'
import { NotificationList } from '@/features/notifications/components/NotificationList'
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications'
import { useConfirm } from '@/hooks/useConfirm'
import { useNotify } from '@/hooks/useNotify'

/** Ghép layout (không biết gì về phiên) với dữ liệu phiên + đăng xuất. */
export function AdminShell({ menu, routes }: { menu: readonly MenuEntry[]; routes: readonly RouteObject[] }) {
  const { user } = useSession()
  useEffect(() => prefetchRouteChunks(routes), [routes])
  const logout = useLogout()
  const confirm = useConfirm()
  const notify = useNotify()

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Đăng xuất khỏi hệ thống?',
      content: 'Bạn sẽ cần đăng nhập lại để tiếp tục làm việc.',
      okText: 'Đăng xuất',
      danger: true,
    })
    if (!ok) return
    logout.mutate(undefined, {
      onSuccess: () => notify.info('Đã đăng xuất thành công'),
    })
  }

  return <AdminLayout menu={menu} user={user} onLogout={handleLogout} loggingOut={logout.isPending} />
}

export function MobileShell({ tabs }: { tabs: readonly MenuEntry[] }) {
  const { user } = useSession()
  const logout = useLogout()
  const confirm = useConfirm()
  const notify = useNotify()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const { data: unreadData } = useUnreadCount()
  const unreadCount = unreadData?.unreadCount ?? 0

  const handleLogout = async () => {
    setUserMenuOpen(false)
    const ok = await confirm({
      title: 'Đăng xuất?',
      content: 'Xác nhận thoát khỏi phiên làm việc hiện tại.',
      okText: 'Đăng xuất',
      danger: true,
    })
    if (!ok) return
    logout.mutate(undefined, {
      onSuccess: () => notify.info('Đã đăng xuất thành công'),
    })
  }

  const isStore = user?.roles?.includes('STORE_MANAGER') ?? false
  const roleLabel = isStore
    ? 'Cửa hàng trưởng'
    : user?.roles?.includes('SYSTEM_ADMIN')
    ? 'Quản trị hệ thống'
    : 'Chuyên viên KSVH'
  const userInitial = user?.fullName ? user.fullName.trim().charAt(0).toUpperCase() : 'U'

  const isExecuteScreen = location.pathname.startsWith('/qc/execute')
  const currentTab = searchParams.get('tab') === 'findings' ? 'findings' : 'tasks'

  const mobileFooter = isExecuteScreen ? null : (
    <TabBar
      activeKey={currentTab}
      onChange={(key) => {
        if (key === 'tasks') navigate('/qc?tab=tasks')
        else if (key === 'findings') navigate('/qc?tab=findings')
        else if (key === 'notifications') setNotifOpen(true)
        else if (key === 'profile') setUserMenuOpen(true)
      }}
    >
      <TabBar.Item key="tasks" icon={<CheckSquareOutlined style={{ fontSize: 18 }} />} title="Việc của tôi" />
      <TabBar.Item key="findings" icon={<AlertOutlined style={{ fontSize: 18 }} />} title="Lỗi vi phạm" />
      <TabBar.Item
        key="notifications"
        icon={
          <Badge count={unreadCount} size="small" offset={[2, -2]}>
            <BellOutlined style={{ fontSize: 18 }} />
          </Badge>
        }
        title="Thông báo"
      />
      <TabBar.Item key="profile" icon={<UserOutlined style={{ fontSize: 18 }} />} title="Tài khoản" />
    </TabBar>
  )

  return (
    <>
      <MobileLayout
        title={
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #1677ff 0%, #003eb3 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: -0.5,
                boxShadow: '0 2px 5px rgba(22, 119, 255, 0.35)',
              }}
            >
              QC
            </span>
            <span style={{ fontWeight: 700, fontSize: 16 }}>KSVH QC</span>
          </div>
        }
        documentTitle="KSVH QC"
        rootPath={ROUTES.qc.root}
        tabs={tabs}
        footer={mobileFooter}
        headerRight={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationBell isMobile />
            <div
              role="button"
              tabIndex={0}
              aria-label="Tài khoản cá nhân"
              onClick={() => setUserMenuOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setUserMenuOpen(true)
              }}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--app-primary, #1677ff) 0%, #003eb3 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                userSelect: 'none',
              }}
            >
              {userInitial}
            </div>
            <ActionSheet
              visible={userMenuOpen}
              actions={[
                { text: `${user?.fullName ?? ''} · ${roleLabel}`, key: 'info', disabled: true },
                { text: 'Đăng xuất', key: 'logout', danger: true, onClick: handleLogout },
              ]}
              onClose={() => setUserMenuOpen(false)}
              cancelText="Đóng"
            />
          </div>
        }
      />

      <Drawer
        title="Thông báo"
        placement="bottom"
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        styles={{ wrapper: { height: '75vh' }, body: { padding: 0 } }}
      >
        <NotificationList onItemClick={() => setNotifOpen(false)} />
      </Drawer>
    </>
  )
}

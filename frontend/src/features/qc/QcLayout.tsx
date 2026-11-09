import { NavBar, SafeArea, TabBar } from 'antd-mobile'
import { AppOutline, UserOutline } from 'antd-mobile-icons'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useAuthStore } from '@/features/auth/authStore'

/** Khung giao diện chấm QC trên điện thoại: thanh tiêu đề + thanh tab dưới đáy, thao tác một tay. */
export function QcLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const isRoot = pathname === '/qc'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <SafeArea position="top" />
      <NavBar backIcon={!isRoot} onBack={() => navigate(-1)} right={<span onClick={logout}>Thoát</span>}>
        KSVH QC
      </NavBar>
      <div style={{ flex: 1, overflowY: 'auto', background: '#f5f5f5' }}>
        <Outlet />
      </div>
      <TabBar activeKey={isRoot ? '/qc' : pathname} onChange={(key) => navigate(key)}>
        <TabBar.Item key="/qc" icon={<AppOutline />} title="Việc chấm" />
        <TabBar.Item key="/qc/checkin-demo" icon={<UserOutline />} title="Thử GPS & ảnh" />
      </TabBar>
      <SafeArea position="bottom" />
    </div>
  )
}

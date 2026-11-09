import { DashboardOutlined, LogoutOutlined, MobileOutlined } from '@ant-design/icons'
import { Button, Layout, Menu, Space, Typography } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useAuthStore } from '@/features/auth/authStore'

const { Header, Sider, Content } = Layout

/** Khung dashboard quản lý (máy tính). Thêm mục menu khi có module mới. */
export function AdminLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()

  const items = [
    { key: '/admin', icon: <DashboardOutlined />, label: 'Tổng quan' },
    { key: '/qc', icon: <MobileOutlined />, label: 'Giao diện chấm QC' },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={0} theme="light">
        <div style={{ padding: 16, fontWeight: 700, fontSize: 18 }}>KSVH QC</div>
        <Menu mode="inline" selectedKeys={[pathname]} items={items} onClick={(e) => navigate(e.key)} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', display: 'flex', justifyContent: 'flex-end', paddingInline: 16 }}>
          <Space>
            <Typography.Text>{user?.fullName}</Typography.Text>
            <Button icon={<LogoutOutlined />} onClick={logout}>
              Đăng xuất
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

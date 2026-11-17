import {
  CrownOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import { Alert, Divider, Flex, Tooltip, Typography } from 'antd'
import { useNavigate, useSearchParams } from 'react-router'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { useSession } from '@/features/auth/hooks/useSession'
import { useNotify } from '@/hooks/useNotify'
import { getErrorMessage } from '@/lib/http'
import { getHomePath } from '@/permissions/areas'
import { safeRedirectPath } from '@/utils/safe-redirect'

const QUICK_ROLES = [
  {
    key: 'admin',
    label: 'Quản trị viên',
    desc: 'Toàn quyền cấu hình, tài khoản, tiêu chí & báo cáo',
    icon: <CrownOutlined style={{ color: '#0f172a', fontSize: 15 }} />,
    user: 'admin',
    pass: 'Admin@123',
    badgeBg: 'rgba(15, 23, 42, 0.06)',
  },
  {
    key: 'inspector',
    label: 'Chuyên viên QC',
    desc: 'Lập kế hoạch, chấm điểm phiếu & ghi nhận lỗi',
    icon: <SafetyCertificateOutlined style={{ color: '#059669', fontSize: 15 }} />,
    user: 'inspector',
    pass: 'Inspector@123',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
  },
  {
    key: 'store',
    label: 'Cửa hàng trưởng',
    desc: 'Giải trình lỗi, báo cáo khắc phục & phúc tra',
    icon: <ShopOutlined style={{ color: '#d97706', fontSize: 15 }} />,
    user: 'store',
    pass: 'Store@123',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
  },
]

export function LoginPage() {
  const login = useLogin()
  const notify = useNotify()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { endReason } = useSession()

  const handleQuickLogin = (username: string, password: string) => {
    login.mutate(
      { username, password },
      {
        onSuccess: (session) => {
          notify.success(`Đăng nhập thành công! Xin chào ${session.user.fullName}`)
          navigate(safeRedirectPath(params.get('redirect')) ?? getHomePath(session.user), { replace: true })
        },
      },
    )
  }

  return (
    <AuthLayout title="KSVH QC" subtitle="Hệ thống Kiểm soát Vận hành & Tiêu chuẩn Chất lượng">
      {login.isError ? (
        <Alert type="error" showIcon title={getErrorMessage(login.error)} style={{ marginBottom: 16, borderRadius: 8 }} />
      ) : (
        endReason === 'expired' && (
          <Alert type="warning" showIcon title="Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại" style={{ marginBottom: 16, borderRadius: 8 }} />
        )
      )}

      <LoginForm
        loading={login.isPending}
        onSubmit={(values) =>
          login.mutate(values, {
            onSuccess: (session) => {
              notify.success(`Đăng nhập thành công! Xin chào ${session.user.fullName}`)
              navigate(safeRedirectPath(params.get('redirect')) ?? getHomePath(session.user), { replace: true })
            },
          })
        }
      />

      <Divider style={{ margin: '22px 0 16px', fontSize: 12, color: '#94a3b8' }}>
        Hoặc truy cập nhanh theo phân quyền
      </Divider>

      <Flex gap={10} justify="space-between">
        {QUICK_ROLES.map((role) => (
          <Tooltip key={role.key} title={role.desc} placement="top">
            <button
              type="button"
              disabled={login.isPending}
              onClick={() => handleQuickLogin(role.user, role.pass)}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.9)',
                background: 'rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
                cursor: login.isPending ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: role.badgeBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {role.icon}
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>
                {role.label}
              </span>
            </button>
          </Tooltip>
        ))}
      </Flex>

      <Flex justify="center" align="center" gap={6} style={{ marginTop: 20 }}>
        <LockOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
        <Typography.Text style={{ fontSize: 11.5, color: '#94a3b8' }}>
          Bảo mật định danh 2 lớp · Kết nối cơ sở dữ liệu MySQL 8.4
        </Typography.Text>
      </Flex>
    </AuthLayout>
  )
}

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
    icon: <CrownOutlined style={{ color: '#0f172a' }} />,
    user: 'admin',
    pass: 'Admin@123',
    bg: '#f1f5f9',
    border: '#cbd5e1',
  },
  {
    key: 'inspector',
    label: 'Chuyên viên QC',
    desc: 'Lập kế hoạch, chấm điểm phiếu & ghi nhận lỗi',
    icon: <SafetyCertificateOutlined style={{ color: '#10b981' }} />,
    user: 'inspector',
    pass: 'Inspector@123',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    key: 'store',
    label: 'Cửa hàng trưởng',
    desc: 'Giải trình lỗi, báo cáo khắc phục & phúc tra',
    icon: <ShopOutlined style={{ color: '#f59e0b' }} />,
    user: 'store',
    pass: 'Store@123',
    bg: '#fffbeb',
    border: '#fde68a',
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

      <Flex gap={8} justify="space-between">
        {QUICK_ROLES.map((role) => (
          <Tooltip key={role.key} title={role.desc} placement="top">
            <button
              type="button"
              disabled={login.isPending}
              onClick={() => handleQuickLogin(role.user, role.pass)}
              style={{
                flex: 1,
                padding: '8px 6px',
                borderRadius: 8,
                border: `1px solid ${role.border}`,
                background: role.bg,
                cursor: login.isPending ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 15 }}>{role.icon}</span>
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

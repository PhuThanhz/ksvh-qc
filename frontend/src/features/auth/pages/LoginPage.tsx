import { CrownOutlined, SafetyCertificateOutlined, ShopOutlined } from '@ant-design/icons'
import { Alert, Divider, Flex, Tooltip } from 'antd'
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
    label: 'Admin',
    fullName: 'Quản trị viên (admin)',
    icon: <CrownOutlined style={{ color: '#2563eb', fontSize: 13 }} />,
    user: 'admin',
    pass: 'Admin@123',
  },
  {
    key: 'inspector',
    label: 'QC',
    fullName: 'Chuyên viên QC (inspector)',
    icon: <SafetyCertificateOutlined style={{ color: '#059669', fontSize: 13 }} />,
    user: 'inspector',
    pass: 'Inspector@123',
  },
  {
    key: 'store',
    label: 'Cửa hàng',
    fullName: 'Cửa hàng trưởng (store)',
    icon: <ShopOutlined style={{ color: '#d97706', fontSize: 13 }} />,
    user: 'store',
    pass: 'Store@123',
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
    <AuthLayout title="KSVH QC" subtitle="Đăng nhập để vào hệ thống quản lý">
      {login.isError ? (
        <Alert
          type="error"
          showIcon
          message={getErrorMessage(login.error)}
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      ) : (
        endReason === 'expired' && (
          <Alert
            type="warning"
            showIcon
            message="Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại"
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
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

      <Divider style={{ margin: '20px 0 16px', fontSize: 12, color: '#94a3b8' }}>
        Hoặc đăng nhập nhanh bằng tài khoản mẫu
      </Divider>

      <Flex gap={8} justify="center">
        {QUICK_ROLES.map((role) => (
          <Tooltip key={role.key} title={role.fullName}>
            <button
              type="button"
              disabled={login.isPending}
              onClick={() => handleQuickLogin(role.user, role.pass)}
              style={{
                flex: 1,
                padding: '9px 8px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                cursor: login.isPending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 500,
                color: '#334155',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9'
                e.currentTarget.style.borderColor = '#cbd5e1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc'
                e.currentTarget.style.borderColor = '#e2e8f0'
              }}
            >
              {role.icon}
              <span>{role.label}</span>
            </button>
          </Tooltip>
        ))}
      </Flex>
    </AuthLayout>
  )
}

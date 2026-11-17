import { Alert, Button } from 'antd'
import { useNavigate, useSearchParams } from 'react-router'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { useSession } from '@/features/auth/hooks/useSession'
import { useNotify } from '@/hooks/useNotify'
import { getErrorMessage } from '@/lib/http'
import { getHomePath } from '@/permissions/areas'
import { safeRedirectPath } from '@/utils/safe-redirect'

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
    <AuthLayout title="KSVH QC" subtitle="Đăng nhập để tiếp tục">
      {login.isError ? (
        <Alert type="error" showIcon title={getErrorMessage(login.error)} style={{ marginBottom: 16 }} />
      ) : (
        endReason === 'expired' && (
          <Alert type="warning" showIcon title="Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại" style={{ marginBottom: 16 }} />
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
      <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--app-surface-muted)', borderRadius: 10, border: '1px solid var(--app-border)', fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontWeight: 600, color: 'var(--app-text)' }}>Chọn tài khoản để đăng nhập nhanh:</span>
          <span style={{ fontSize: 11, color: 'var(--app-success)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--app-success)', display: 'inline-block' }} />
            MySQL 8.4
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <Button
            size="middle"
            type="default"
            block
            loading={login.isPending}
            onClick={() => handleQuickLogin('admin', 'Admin@123')}
            style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 8, height: 38 }}
          >
            <span><strong style={{ color: 'var(--app-text)' }}>Quản trị hệ thống</strong> <span style={{ color: 'var(--app-text-secondary)', fontSize: 12 }}>(admin)</span></span>
            <span style={{ color: 'var(--app-text-muted)', fontSize: 12, fontFamily: 'monospace' }}>Admin@123</span>
          </Button>
          <Button
            size="middle"
            type="default"
            block
            loading={login.isPending}
            onClick={() => handleQuickLogin('inspector', 'Inspector@123')}
            style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 8, height: 38 }}
          >
            <span><strong style={{ color: 'var(--app-success)' }}>Chuyên viên KSVH</strong> <span style={{ color: 'var(--app-text-secondary)', fontSize: 12 }}>(inspector)</span></span>
            <span style={{ color: 'var(--app-text-muted)', fontSize: 12, fontFamily: 'monospace' }}>Inspector@123</span>
          </Button>
          <Button
            size="middle"
            type="default"
            block
            loading={login.isPending}
            onClick={() => handleQuickLogin('store', 'Store@123')}
            style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 8, height: 38 }}
          >
            <span><strong style={{ color: 'var(--app-warning)' }}>Cửa hàng trưởng</strong> <span style={{ color: 'var(--app-text-secondary)', fontSize: 12 }}>(store)</span></span>
            <span style={{ color: 'var(--app-text-muted)', fontSize: 12, fontFamily: 'monospace' }}>Store@123</span>
          </Button>
        </div>
      </div>
    </AuthLayout>
  )
}

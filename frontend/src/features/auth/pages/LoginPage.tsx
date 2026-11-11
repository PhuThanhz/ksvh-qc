import { Alert } from 'antd'
import { useNavigate, useSearchParams } from 'react-router'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { useSession } from '@/features/auth/hooks/useSession'
import { getErrorMessage } from '@/lib/http'
import { getHomePath } from '@/permissions/areas'
import { safeRedirectPath } from '@/utils/safe-redirect'

export function LoginPage() {
  const login = useLogin()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { endReason } = useSession()

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
            onSuccess: (session) =>
              navigate(safeRedirectPath(params.get('redirect')) ?? getHomePath(session.user), { replace: true }),
          })
        }
      />
    </AuthLayout>
  )
}

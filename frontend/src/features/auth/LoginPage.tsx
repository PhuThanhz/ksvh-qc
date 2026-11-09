import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { authApi } from '@/api/auth'
import { errorMessage } from '@/api/http'
import { homePathFor, useAuthStore } from '@/features/auth/authStore'

const schema = z.object({
  username: z.string().trim().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})
type LoginForm = z.infer<typeof schema>

export function LoginPage() {
  const { user, setSession } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const { control, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  })

  const login = useMutation({
    mutationFn: (v: LoginForm) => authApi.login(v.username, v.password),
    onSuccess: (res) => {
      setSession(res)
      navigate(from ?? homePathFor(res.user), { replace: true })
    },
  })

  if (user) return <Navigate to={homePathFor(user)} replace />

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <Card style={{ width: '100%', maxWidth: 380 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginTop: 0 }}>
          KSVH QC
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
          Đăng nhập để tiếp tục
        </Typography.Paragraph>

        {login.isError && (
          <Alert type="error" showIcon title={errorMessage(login.error)} style={{ marginBottom: 16 }} />
        )}

        <Form layout="vertical" onFinish={handleSubmit((v) => login.mutate(v))}>
          <Form.Item
            label="Tên đăng nhập"
            validateStatus={formState.errors.username ? 'error' : undefined}
            help={formState.errors.username?.message}
          >
            <Controller
              name="username"
              control={control}
              render={({ field }) => <Input {...field} size="large" autoComplete="username" autoCapitalize="none" />}
            />
          </Form.Item>
          <Form.Item
            label="Mật khẩu"
            validateStatus={formState.errors.password ? 'error' : undefined}
            help={formState.errors.password?.message}
          >
            <Controller
              name="password"
              control={control}
              render={({ field }) => <Input.Password {...field} size="large" autoComplete="current-password" />}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={login.isPending}>
            Đăng nhập
          </Button>
        </Form>
      </Card>
    </div>
  )
}

import { LockOutlined, LoginOutlined, UserOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Checkbox, Flex, Form } from 'antd'
import { useForm } from 'react-hook-form'
import { FormInput } from '@/components/data-entry/FormInput'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/login.schema'

export interface LoginFormProps {
  loading: boolean
  onSubmit: (values: LoginFormValues) => void
}

export function LoginForm({ loading, onSubmit }: LoginFormProps) {
  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  return (
    <Form layout="vertical" onFinish={handleSubmit(onSubmit)} requiredMark={false} style={{ width: '100%' }}>
      <FormInput
        control={control}
        name="username"
        label="Tên đăng nhập"
        size="large"
        placeholder="Nhập tên tài khoản (vd: admin)"
        prefix={<UserOutlined style={{ color: '#94a3b8', fontSize: 15 }} />}
        autoComplete="username"
        autoCapitalize="none"
        autoFocus
      />
      <FormInput
        control={control}
        name="password"
        label="Mật khẩu"
        type="password"
        size="large"
        placeholder="Nhập mật khẩu truy cập"
        prefix={<LockOutlined style={{ color: '#94a3b8', fontSize: 15 }} />}
        autoComplete="current-password"
      />
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <Checkbox defaultChecked style={{ fontSize: 13, color: '#64748b' }}>
          Ghi nhớ phiên đăng nhập
        </Checkbox>
        <span style={{ fontSize: 13, color: '#64748b', cursor: 'pointer' }}>
          Quên mật khẩu?
        </span>
      </Flex>
      <Button
        type="primary"
        htmlType="submit"
        size="large"
        block
        loading={loading}
        icon={<LoginOutlined />}
        style={{
          height: 44,
          borderRadius: 10,
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: -0.2,
          background: '#0f172a',
          borderColor: '#0f172a',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
        }}
      >
        Đăng nhập hệ thống
      </Button>
    </Form>
  )
}

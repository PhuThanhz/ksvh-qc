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
        type="default"
        htmlType="submit"
        size="large"
        block
        loading={loading}
        icon={<LoginOutlined style={{ color: '#0f172a' }} />}
        style={{
          height: 46,
          borderRadius: 10,
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: -0.2,
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          color: '#0f172a',
          border: '1.5px solid #cbd5e1',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        }}
      >
        Đăng nhập hệ thống
      </Button>
    </Form>
  )
}

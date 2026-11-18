import { ArrowRightOutlined, LockOutlined, UserOutlined } from '@ant-design/icons'
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
        label={<span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>Tên đăng nhập</span>}
        size="large"
        placeholder="Nhập tên đăng nhập"
        prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
        autoComplete="username"
        autoCapitalize="none"
        style={{ borderRadius: 8, height: 42 }}
      />
      <FormInput
        control={control}
        name="password"
        label={<span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>Mật khẩu</span>}
        type="password"
        size="large"
        placeholder="Nhập mật khẩu"
        prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
        autoComplete="current-password"
        style={{ borderRadius: 8, height: 42 }}
      />
      <Flex justify="space-between" align="center" style={{ marginBottom: 20, marginTop: 4 }}>
        <Checkbox defaultChecked style={{ fontSize: 13, color: '#64748b' }}>
          Ghi nhớ đăng nhập
        </Checkbox>
        <a style={{ fontSize: 13, color: '#2563eb' }} onClick={(e) => e.preventDefault()}>
          Quên mật khẩu?
        </a>
      </Flex>
      <Button
        type="primary"
        htmlType="submit"
        size="large"
        block
        loading={loading}
        style={{
          height: 42,
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 14,
          background: '#2563eb',
        }}
      >
        <Flex align="center" justify="center" gap={8}>
          <span>Đăng nhập</span>
          <ArrowRightOutlined style={{ fontSize: 13 }} />
        </Flex>
      </Button>
    </Form>
  )
}

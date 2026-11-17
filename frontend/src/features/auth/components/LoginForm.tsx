import { ArrowRightOutlined, LockOutlined, UserOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Checkbox, Flex, Form } from 'antd'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormInput } from '@/components/data-entry/FormInput'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/login.schema'

export interface LoginFormProps {
  loading: boolean
  onSubmit: (values: LoginFormValues) => void
}

export function LoginForm({ loading, onSubmit }: LoginFormProps) {
  const [hovered, setHovered] = useState(false)
  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  return (
    <Form layout="vertical" onFinish={handleSubmit(onSubmit)} requiredMark={false} style={{ width: '100%' }}>
      <FormInput
        control={control}
        name="username"
        label={<span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Tên đăng nhập</span>}
        size="large"
        placeholder="Nhập tên tài khoản (vd: admin)"
        prefix={<UserOutlined style={{ color: '#94a3b8', fontSize: 15 }} />}
        autoComplete="username"
        autoCapitalize="none"
        style={{
          borderRadius: 12,
          background: 'rgba(255, 255, 255, 0.75)',
          border: '1px solid rgba(203, 213, 225, 0.8)',
          height: 44,
        }}
      />
      <FormInput
        control={control}
        name="password"
        label={<span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Mật khẩu</span>}
        type="password"
        size="large"
        placeholder="Nhập mật khẩu truy cập"
        prefix={<LockOutlined style={{ color: '#94a3b8', fontSize: 15 }} />}
        autoComplete="current-password"
        style={{
          borderRadius: 12,
          background: 'rgba(255, 255, 255, 0.75)',
          border: '1px solid rgba(203, 213, 225, 0.8)',
          height: 44,
        }}
      />
      <Flex justify="space-between" align="center" style={{ marginBottom: 22, marginTop: 4 }}>
        <Checkbox defaultChecked style={{ fontSize: 13, color: '#475569' }}>
          Ghi nhớ phiên đăng nhập
        </Checkbox>
        <span style={{ fontSize: 13, color: '#475569', fontWeight: 500, cursor: 'pointer' }}>
          Quên mật khẩu?
        </span>
      </Flex>
      <Button
        type="default"
        htmlType="submit"
        size="large"
        block
        loading={loading}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          height: 48,
          borderRadius: 24,
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: -0.2,
          color: '#0f172a',
          background: hovered
            ? 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(241, 245, 249, 0.88) 100%)',
          border: '1px solid rgba(15, 23, 42, 0.12)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: hovered
            ? '0 8px 24px -2px rgba(15, 23, 42, 0.14), 0 2px 6px rgba(15, 23, 42, 0.06), inset 0 1.5px 1px #ffffff'
            : '0 4px 16px -2px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04), inset 0 1.5px 1px #ffffff',
          transform: hovered ? 'translateY(-1px)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'pointer',
        }}
      >
        <Flex align="center" justify="center" gap={8}>
          <span>Đăng nhập hệ thống</span>
          <ArrowRightOutlined style={{ fontSize: 14, color: '#0f172a' }} />
        </Flex>
      </Button>
    </Form>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Form } from 'antd'
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
    <Form layout="vertical" onFinish={handleSubmit(onSubmit)} requiredMark={false}>
      <FormInput
        control={control}
        name="username"
        label="Tên đăng nhập"
        size="large"
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
        autoComplete="current-password"
      />
      <Button type="primary" htmlType="submit" size="large" block loading={loading}>
        Đăng nhập
      </Button>
    </Form>
  )
}

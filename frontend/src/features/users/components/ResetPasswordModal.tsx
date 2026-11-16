import { CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Flex, Form, Modal, Space } from 'antd'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { FormInput } from '@/components/data-entry/FormInput'
import { useNotify } from '@/components/feedback/useNotify'
import { useResetPassword } from '@/features/users/hooks/useUserMutations'
import { passwordResetSchema, type PasswordResetValues } from '@/features/users/schemas/user.schema'
import type { User } from '@/features/users/users.types'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'

const EMPTY: PasswordResetValues = { newPassword: '', confirm: '' }

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const digits = '23456789'
  const randomChars = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const randomDigits = Array.from({ length: 4 }, () => digits[Math.floor(Math.random() * digits.length)]).join('')
  return `Ksvh@${randomChars}${randomDigits}`
}

export function ResetPasswordModal({ user, onClose }: { user?: User; onClose: () => void }) {
  const notify = useNotify()
  const reset = useResetPassword()
  const [copiedPassword, setCopiedPassword] = useState('')
  const form = useForm<PasswordResetValues>({ resolver: zodResolver(passwordResetSchema), defaultValues: EMPTY })
  const currentPassword = useWatch({ control: form.control, name: 'newPassword' })
  const copied = Boolean(copiedPassword && copiedPassword === currentPassword)

  useEffect(() => {
    if (user) {
      form.reset(EMPTY)
    }
  }, [user, form])

  const onGenerate = () => {
    const pw = generateRandomPassword()
    form.setValue('newPassword', pw, { shouldValidate: true })
    form.setValue('confirm', pw, { shouldValidate: true })
  }

  const onCopy = async () => {
    if (!currentPassword) return
    try {
      await navigator.clipboard.writeText(currentPassword)
      setCopiedPassword(currentPassword)
      notify.success('Đã sao chép mật khẩu vào clipboard')
    } catch {
      notify.error('Không thể sao chép mật khẩu')
    }
  }

  const onSubmit = form.handleSubmit(({ newPassword }) => {
    if (!user) return
    reset.mutate(
      { id: user.id, body: { newPassword } },
      {
        onSuccess: () => {
          notify.success(`Đã đặt lại mật khẩu cho ${user.username}; mọi phiên đăng nhập của họ đã bị thu hồi`)
          onClose()
        },
        onError: (err) => {
          if (!applyFieldErrors(err, form.setError)) notify.error(getErrorMessage(err))
        },
      },
    )
  })

  return (
    <Modal
      open={Boolean(user)}
      title={user ? `Đặt lại mật khẩu: ${user.fullName} (${user.username})` : ''}
      okText="Xác nhận đặt lại"
      cancelText="Huỷ"
      centered
      okButtonProps={{ danger: true }}
      confirmLoading={reset.isPending}
      onOk={() => void onSubmit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form layout="vertical" onFinish={() => void onSubmit()}>
        <button type="submit" hidden />
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          title="Mọi phiên đăng nhập hiện tại của người dùng này sẽ bị thu hồi ngay lập tức."
        />
        <Flex justify="flex-end" style={{ marginBottom: 8 }}>
          <Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={onGenerate}>
              Tạo mật khẩu ngẫu nhiên
            </Button>
            {currentPassword && (
              <Button size="small" icon={<CopyOutlined />} onClick={() => void onCopy()}>
                {copied ? 'Đã chép' : 'Sao chép'}
              </Button>
            )}
          </Space>
        </Flex>
        <FormInput control={form.control} name="newPassword" label="Mật khẩu mới" type="password" required autoComplete="new-password" />
        <FormInput control={form.control} name="confirm" label="Nhập lại mật khẩu mới" type="password" required autoComplete="new-password" />
      </Form>
    </Modal>
  )
}

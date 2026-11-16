import { zodResolver } from '@hookform/resolvers/zod'
import { Form, Modal } from 'antd'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FormField } from '@/components/data-entry/FormField'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormSwitch } from '@/components/data-entry/FormSwitch'
import { useNotify } from '@/components/feedback/useNotify'
import { RoleSelect } from '@/features/users/components/RoleSelect'
import { useCreateUser } from '@/features/users/hooks/useUserMutations'
import { userCreateSchema, type UserCreateValues } from '@/features/users/schemas/user.schema'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'

const EMPTY: UserCreateValues = { username: '', fullName: '', password: '', roles: [], active: true }

export function UserCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const notify = useNotify()
  const create = useCreateUser()
  const { control, handleSubmit, reset, setError } = useForm<UserCreateValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  const onSubmit = handleSubmit((values) =>
    create.mutate(values, {
      onSuccess: (u) => {
        notify.success(`Đã tạo tài khoản ${u.username}`)
        onClose()
      },
      onError: (err) => {
        if (!applyFieldErrors(err, setError)) notify.error(getErrorMessage(err))
      },
    }),
  )

  return (
    <Modal
      open={open}
      title="Tạo người dùng"
      okText="Tạo"
      cancelText="Huỷ"
      centered
      confirmLoading={create.isPending}
      onOk={() => void onSubmit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form layout="vertical" onFinish={() => void onSubmit()}>
        {/* Nút submit ẩn: nhấn Enter trong ô nhập sẽ lưu (nút Lưu nằm ở footer, ngoài form). */}
        <button type="submit" hidden />
        <FormInput control={control} name="username" label="Tên đăng nhập" required autoComplete="off" maxLength={50} />
        <FormInput control={control} name="fullName" label="Họ tên" required maxLength={150} />
        <FormInput
          control={control}
          name="password"
          label="Mật khẩu ban đầu"
          type="password"
          required
          autoComplete="new-password"
          extra="Tối thiểu 8 ký tự, có cả chữ và số. Gửi riêng cho người dùng."
        />
        <FormField
          control={control}
          name="roles"
          label="Vai trò"
          required
          render={(field) => <RoleSelect value={field.value as string[]} onChange={field.onChange} />}
        />
        <FormSwitch control={control} name="active" label="Đang hoạt động" />
      </Form>
    </Modal>
  )
}

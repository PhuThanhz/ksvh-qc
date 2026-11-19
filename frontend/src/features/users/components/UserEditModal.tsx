import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Form, Modal } from 'antd'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { FormField } from '@/components/data-entry/FormField'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormSwitch } from '@/components/data-entry/FormSwitch'
import { useNotify } from '@/components/feedback/useNotify'
import { RestaurantAssignmentFields } from '@/features/users/components/RestaurantAssignmentFields'
import { RoleSelect } from '@/features/users/components/RoleSelect'
import { useUpdateUser } from '@/features/users/hooks/useUserMutations'
import { useUserRestaurantAssignment } from '@/features/users/hooks/useUserRestaurantAssignment'
import { userUpdateSchema, type UserUpdateValues } from '@/features/users/schemas/user.schema'
import type { User } from '@/features/users/users.types'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'

export interface UserEditModalProps {
  user?: User
  onClose: () => void
}

export function UserEditModal({ user, onClose }: UserEditModalProps) {
  const notify = useNotify()
  const update = useUpdateUser()
  const { control, handleSubmit, reset, setError } = useForm<UserUpdateValues>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: { fullName: '', roles: [], active: true },
  })

  const roles = useWatch({ control, name: 'roles' })
  const assignment = useUserRestaurantAssignment(user?.id, Boolean(user))

  useEffect(() => {
    if (user) reset({ fullName: user.fullName, roles: user.roles, active: user.active })
  }, [user, reset])

  const onSubmit = handleSubmit((values) => {
    if (!user) return
    update.mutate(
      { id: user.id, body: values },
      {
        onSuccess: async () => {
          try {
            await assignment.save(user.id, values.roles, false)
            notify.success('Đã cập nhật người dùng')
            onClose()
          } catch (err) {
            notify.error(`Đã lưu thông tin người dùng nhưng chưa gán được nhà hàng: ${getErrorMessage(err)}`)
          }
        },
        onError: (err) => {
          if (!applyFieldErrors(err, setError)) notify.error(getErrorMessage(err))
        },
      },
    )
  })

  return (
    <Modal
      open={Boolean(user)}
      title={user ? `Sửa người dùng: ${user.username}` : ''}
      okText="Lưu"
      cancelText="Huỷ"
      centered
      confirmLoading={update.isPending || assignment.saving || assignment.loading}
      onOk={() => void onSubmit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form layout="vertical" onFinish={() => void onSubmit()}>
        {/* Nút submit ẩn: nhấn Enter trong ô nhập sẽ lưu (nút Lưu nằm ở footer, ngoài form). */}
        <button type="submit" hidden />
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title="Khoá tài khoản sẽ đăng xuất người đó; đổi vai trò có hiệu lực khi họ làm mới phiên (tối đa 30 phút)."
        />
        <FormInput control={control} name="fullName" label="Họ tên" required maxLength={150} />
        <FormField
          control={control}
          name="roles"
          label="Vai trò"
          required
          render={(field) => <RoleSelect value={field.value as string[]} onChange={field.onChange} />}
        />
        {assignment.canManage && (
          <RestaurantAssignmentFields
            roles={roles}
            value={assignment.value}
            onChange={assignment.setValue}
            userId={user?.id}
            current={assignment.current}
          />
        )}
        <FormSwitch control={control} name="active" label="Đang hoạt động" />
      </Form>
    </Modal>
  )
}

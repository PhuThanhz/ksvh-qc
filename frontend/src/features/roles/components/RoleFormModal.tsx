import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Form, Modal } from 'antd'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FormField } from '@/components/data-entry/FormField'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormTextarea } from '@/components/data-entry/FormTextarea'
import { useNotify } from '@/components/feedback/useNotify'
import { PermissionChecklist } from '@/features/roles/components/PermissionChecklist'
import { usePermissionCatalog, useSaveRole } from '@/features/roles/hooks/useRoles'
import type { Role } from '@/features/roles/roles.types'
import { roleSchema, type RoleFormValues } from '@/features/roles/schemas/role.schema'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'

const EMPTY: RoleFormValues = { code: '', name: '', description: '', permissions: [] }

export interface RoleFormModalProps {
  open: boolean
  role?: Role
  onClose: () => void
}

export function RoleFormModal({ open, role, onClose }: RoleFormModalProps) {
  const notify = useNotify()
  const save = useSaveRole()
  const catalog = usePermissionCatalog()
  const { control, handleSubmit, reset, setError } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (!open) return
    reset(
      role
        ? { code: role.code, name: role.name, description: role.description ?? '', permissions: role.permissions }
        : EMPTY,
    )
  }, [open, role, reset])

  const onSubmit = handleSubmit((values) =>
    save.mutate(
      { id: role?.id, body: { ...values, description: values.description || undefined } },
      {
        onSuccess: () => {
          notify.success(role ? 'Đã cập nhật vai trò' : 'Đã tạo vai trò')
          onClose()
        },
        onError: (err) => {
          if (!applyFieldErrors(err, setError)) notify.error(getErrorMessage(err))
        },
      },
    ),
  )

  return (
    <Modal
      open={open}
      title={role ? `Sửa vai trò: ${role.name}` : 'Tạo vai trò'}
      okText="Lưu"
      cancelText="Huỷ"
      width={760}
      centered
      styles={{ body: { maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', paddingRight: 4 } }}
      confirmLoading={save.isPending}
      onOk={() => void onSubmit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form layout="vertical" onFinish={() => void onSubmit()}>
        {/* Nút submit ẩn: nhấn Enter trong ô nhập sẽ lưu (nút Lưu nằm ở footer, ngoài form). */}
        <button type="submit" hidden />
        {role?.systemRole && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            title="Vai trò gốc theo tài liệu nghiệp vụ: không đổi mã, không xoá. Thay đổi quyền có hiệu lực khi người dùng làm mới phiên (tối đa 30 phút)."
          />
        )}
        <FormInput
          control={control}
          name="code"
          label="Mã vai trò"
          required
          disabled={Boolean(role)}
          placeholder="VD: AUDIT_VIEWER"
          maxLength={50}
        />
        <FormInput control={control} name="name" label="Tên vai trò" required maxLength={100} />
        <FormTextarea control={control} name="description" label="Mô tả" maxLength={255} autoSize={{ minRows: 2 }} />
        <FormField
          control={control}
          name="permissions"
          label="Quyền"
          render={(field) => (
            <PermissionChecklist
              catalog={catalog.data ?? []}
              value={field.value as string[]}
              onChange={field.onChange}
            />
          )}
        />
      </Form>
    </Modal>
  )
}

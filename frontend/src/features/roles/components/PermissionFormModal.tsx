import { zodResolver } from '@hookform/resolvers/zod'
import { Col, Form, Modal, Row } from 'antd'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormSelect } from '@/components/data-entry/FormSelect'
import { useNotify } from '@/components/feedback/useNotify'
import { MODULE_LABEL, type PermissionInfo } from '@/features/roles/roles.types'

const permissionFormSchema = z.object({
  description: z.string().trim().min(1, 'Vui lòng nhập tên Permission').max(150, 'Tối đa 150 ký tự'),
  apiPath: z.string().trim().min(1, 'Vui lòng nhập API Path').max(150, 'Tối đa 150 ký tự'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  module: z.string().trim().min(1, 'Vui lòng chọn Module'),
})

export type PermissionFormValues = z.infer<typeof permissionFormSchema>

export interface PermissionFormModalProps {
  open: boolean
  permission?: PermissionInfo & { apiPath?: string; method?: string }
  onClose: () => void
  onSave: (item: PermissionInfo & { apiPath: string; method: string; isCustom?: boolean }) => void
}

const METHOD_OPTIONS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
]

const MODULE_OPTIONS = Object.entries(MODULE_LABEL).map(([value, label]) => ({
  value,
  label: `${value.toUpperCase()} (${label})`,
}))

export function deriveApiMeta(p: PermissionInfo & { apiPath?: string; method?: string }) {
  if (p.apiPath && p.method) {
    return { apiPath: p.apiPath, method: p.method }
  }
  const [mod, action] = p.code.split(':')
  const basePath = `/api/v1/${mod}s`
  if (action?.includes('read')) return { method: 'GET', apiPath: basePath }
  if (action?.includes('create') || action?.includes('upload') || action?.includes('perform')) {
    return { method: 'POST', apiPath: basePath }
  }
  if (action?.includes('delete') || action?.includes('cancel')) {
    return { method: 'DELETE', apiPath: `${basePath}/{id}` }
  }
  if (action?.includes('respond') || action?.includes('verify') || action?.includes('approve')) {
    return { method: 'PATCH', apiPath: `${basePath}/{id}/${action}` }
  }
  return { method: 'PUT', apiPath: `${basePath}/{id}` }
}

export function PermissionFormModal({
  open,
  permission,
  onClose,
  onSave,
}: PermissionFormModalProps) {
  const notify = useNotify()
  const { control, handleSubmit, reset, setValue, formState } = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: {
      description: '',
      apiPath: '/api/v1/users',
      method: 'GET',
      module: 'user',
    },
  })

  const watchedModule = useWatch({ control, name: 'module' })
  const watchedMethod = useWatch({ control, name: 'method' })

  useEffect(() => {
    if (!open || permission || formState.dirtyFields.apiPath) return
    const mod = watchedModule || 'user'
    const base = `/api/v1/${mod}s`
    const nextPath =
      watchedMethod === 'PUT' || watchedMethod === 'PATCH' || watchedMethod === 'DELETE'
        ? `${base}/{id}`
        : base
    setValue('apiPath', nextPath, { shouldValidate: false })
  }, [open, permission, watchedModule, watchedMethod, formState.dirtyFields.apiPath, setValue])

  useEffect(() => {
    if (!open) return
    if (permission) {
      const meta = deriveApiMeta(permission)
      reset({
        description: permission.description,
        apiPath: meta.apiPath,
        method: (meta.method as PermissionFormValues['method']) || 'GET',
        module: permission.module,
      })
    } else {
      reset({
        description: '',
        apiPath: '/api/v1/users',
        method: 'GET',
        module: 'user',
      })
    }
  }, [open, permission, reset])

  const onSubmit = handleSubmit((values) => {
    const actionSlug = values.method === 'GET' ? 'read' : values.method === 'POST' ? 'create' : values.method === 'DELETE' ? 'delete' : 'manage'
    const code = permission?.code ?? `${values.module}:${actionSlug}:${Date.now().toString().slice(-3)}`
    onSave({
      code,
      module: values.module,
      description: values.description,
      roles: permission?.roles ?? [],
      apiPath: values.apiPath,
      method: values.method,
      isCustom: true,
    })
    notify.success(permission ? 'Đã cập nhật Permission' : 'Đã tạo mới Permission')
    onClose()
  })

  return (
    <Modal
      open={open}
      title={permission ? 'Chỉnh sửa Permission' : 'Tạo mới Permission'}
      okText={permission ? 'Lưu thay đổi' : 'Tạo mới'}
      cancelText="Huỷ"
      width={680}
      centered
      onOk={() => void onSubmit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form layout="vertical" onFinish={() => void onSubmit()}>
        <button type="submit" hidden />
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <FormInput
              control={control}
              name="description"
              label="Tên Permission"
              required
              placeholder="Nhập tên quyền hạn..."
              maxLength={150}
            />
          </Col>
          <Col xs={24} sm={12}>
            <FormInput
              control={control}
              name="apiPath"
              label="API Path"
              required
              placeholder="Nhập path (VD: /api/v1/inspections)"
              maxLength={150}
            />
          </Col>
          <Col xs={24} sm={12}>
            <FormSelect
              control={control}
              name="method"
              label="Method"
              required
              placeholder="Chọn method"
              options={METHOD_OPTIONS}
            />
          </Col>
          <Col xs={24} sm={12}>
            <FormSelect
              control={control}
              name="module"
              label="Thuộc Module"
              required
              placeholder="Chọn module"
              options={MODULE_OPTIONS}
            />
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

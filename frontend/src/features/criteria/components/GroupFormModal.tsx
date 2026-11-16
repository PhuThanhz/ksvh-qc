import { zodResolver } from '@hookform/resolvers/zod'
import { Form, Modal } from 'antd'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormSelect } from '@/components/data-entry/FormSelect'
import { FormSwitch } from '@/components/data-entry/FormSwitch'
import { useNotify } from '@/components/feedback/useNotify'
import type { CriterionGroup } from '@/features/criteria/criteria.types'
import { useSaveGroup } from '@/features/criteria/hooks/useCriteria'
import { groupSchema, type GroupFormValues } from '@/features/criteria/schemas/criteria.schema'
import { useCompanies } from '@/features/organizations/hooks/useOrganizations'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'

export interface GroupFormModalProps {
  open: boolean
  group?: CriterionGroup
  /** Thứ tự gợi ý khi thêm mới (sau nhóm cuối). */
  nextOrder: number
  onClose: () => void
}

export function GroupFormModal({ open, group, nextOrder, onClose }: GroupFormModalProps) {
  const notify = useNotify()
  const save = useSaveGroup()
  const companies = useCompanies({ page: 0, size: 100, active: true })
  const { control, handleSubmit, reset, setError } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { code: '', name: '', companyId: null, sortOrder: nextOrder, active: true },
  })

  useEffect(() => {
    if (!open) return
    reset(
      group
        ? {
            code: group.code,
            name: group.name,
            companyId: group.companyId ?? null,
            sortOrder: group.sortOrder,
            active: group.active,
          }
        : { code: '', name: '', companyId: null, sortOrder: nextOrder, active: true },
    )
  }, [open, group, nextOrder, reset])

  const companyOptions = useMemo(() => {
    const list = (companies.data?.items ?? []).map((c) => ({
      value: c.id,
      label: `${c.code} – ${c.name}`,
    }))
    if (group?.companyId && group.companyName && !list.some((o) => o.value === group.companyId)) {
      list.unshift({ value: group.companyId, label: group.companyName })
    }
    return list
  }, [companies.data, group])

  const onSubmit = handleSubmit((values) =>
    save.mutate(
      { id: group?.id, body: values },
      {
        onSuccess: () => {
          notify.success(group ? 'Đã cập nhật nhóm' : 'Đã thêm nhóm')
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
      title={group ? 'Sửa nhóm tiêu chí' : 'Thêm nhóm tiêu chí'}
      okText="Lưu"
      cancelText="Huỷ"
      centered
      confirmLoading={save.isPending}
      onOk={() => void onSubmit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form layout="vertical" onFinish={() => void onSubmit()}>
        {/* Nút submit ẩn: nhấn Enter trong ô nhập sẽ lưu (nút Lưu nằm ở footer, ngoài form). */}
        <button type="submit" hidden />
        <FormInput control={control} name="code" label="Mã nhóm" required maxLength={30} placeholder="VD: VSB" />
        <FormInput control={control} name="name" label="Tên nhóm" required maxLength={200} placeholder="VD: Vệ sinh khu bếp" />
        <FormSelect
          control={control}
          name="companyId"
          label="Công ty áp dụng"
          placeholder="Dùng chung toàn hệ thống (mọi công ty)"
          allowClear
          options={companyOptions}
          loading={companies.isLoading}
          extra="Để trống nếu nhóm này dùng chung cho toàn bộ các công ty trong hệ thống"
        />
        <FormSwitch control={control} name="active" label="Đang hoạt động" />
      </Form>
    </Modal>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { Form, Modal } from 'antd'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormSwitch } from '@/components/data-entry/FormSwitch'
import { useNotify } from '@/components/feedback/useNotify'
import { useSaveCompany } from '@/features/organizations/hooks/useOrganizations'
import type { Company } from '@/features/organizations/organizations.types'
import { companySchema, type CompanyFormValues } from '@/features/organizations/schemas/organization.schema'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'

const EMPTY: CompanyFormValues = { code: '', name: '', active: true }

export interface CompanyFormModalProps {
  open: boolean
  /** Có giá trị = sửa; undefined = thêm mới. */
  company?: Company
  onClose: () => void
}

export function CompanyFormModal({ open, company, onClose }: CompanyFormModalProps) {
  const notify = useNotify()
  const save = useSaveCompany()
  const { control, handleSubmit, reset, setError } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (open) reset(company ? { code: company.code, name: company.name, active: company.active } : EMPTY)
  }, [open, company, reset])

  const onSubmit = handleSubmit((values) =>
    save.mutate(
      { id: company?.id, body: values },
      {
        onSuccess: () => {
          notify.success(company ? 'Đã cập nhật công ty' : 'Đã thêm công ty')
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
      title={company ? 'Sửa công ty' : 'Thêm công ty'}
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
        <FormInput control={control} name="code" label="Mã công ty" required maxLength={30} autoFocus placeholder="VD: LOTUS" />
        <FormInput control={control} name="name" label="Tên công ty" required maxLength={200} placeholder="VD: Công ty Cổ phần Tập đoàn Lotus" />
        <FormSwitch control={control} name="active" label="Đang hoạt động" />
      </Form>
    </Modal>
  )
}

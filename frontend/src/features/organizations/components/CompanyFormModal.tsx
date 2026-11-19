import { zodResolver } from '@hookform/resolvers/zod'
import { Form, Modal } from 'antd'
import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormSwitch } from '@/components/data-entry/FormSwitch'
import { useNotify } from '@/components/feedback/useNotify'
import { useCompanies, useSaveCompany } from '@/features/organizations/hooks/useOrganizations'
import type { Company } from '@/features/organizations/organizations.types'
import { companySchema, type CompanyFormValues } from '@/features/organizations/schemas/organization.schema'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'
import { nextSequentialCode, uniqueAcronymCode } from '@/utils/auto-code'

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
  const allCompanies = useCompanies({ page: 0, size: 100 })
  const { control, handleSubmit, reset, setError, setValue, formState } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: EMPTY,
  })

  const existingCodes = useMemo(() => (allCompanies.data?.items ?? []).map((c) => c.code), [allCompanies.data])
  const defaultCode = useMemo(() => nextSequentialCode('CTY', existingCodes, 2, '-'), [existingCodes])

  useEffect(() => {
    if (open) {
      reset(company ? { code: company.code, name: company.name, active: company.active } : { ...EMPTY, code: defaultCode })
    }
  }, [open, company, defaultCode, reset])

  const watchedName = useWatch({ control, name: 'name' })
  useEffect(() => {
    if (!open || company || formState.dirtyFields.code) return
    const trimmed = (watchedName ?? '').trim()
    const generated = trimmed ? uniqueAcronymCode(trimmed, existingCodes, 'CTY', 'CTY') : defaultCode
    setValue('code', generated, { shouldValidate: false })
  }, [open, company, watchedName, existingCodes, defaultCode, formState.dirtyFields.code, setValue])

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
        <FormInput control={control} name="name" label="Tên công ty" required autoFocus={!company} maxLength={200} placeholder="VD: Công ty Cổ phần Tập đoàn Lotus" />
        <FormInput control={control} name="code" label="Mã công ty (Tự sinh theo tên)" required maxLength={30} placeholder="Tự động sinh" />
        <FormSwitch control={control} name="active" label="Đang hoạt động" />
      </Form>
    </Modal>
  )
}

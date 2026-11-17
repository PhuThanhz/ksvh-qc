import { zodResolver } from '@hookform/resolvers/zod'
import { Col, Form, Modal, Row } from 'antd'
import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormNumber } from '@/components/data-entry/FormNumber'
import { FormSelect } from '@/components/data-entry/FormSelect'
import { FormSwitch } from '@/components/data-entry/FormSwitch'
import { FormTextarea } from '@/components/data-entry/FormTextarea'
import { useNotify } from '@/components/feedback/useNotify'
import { IMPACT_LEVELS, type Criterion, type CriterionGroup } from '@/features/criteria/criteria.types'
import { useSaveCriterion } from '@/features/criteria/hooks/useCriteria'
import { useTemplateOptions } from '@/features/criteria/hooks/useTemplates'
import { criterionSchema, type CriterionFormValues } from '@/features/criteria/schemas/criteria.schema'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'

const IMPACT_LABELS: Record<number, string> = {
  1: 'Mức 1 – Rất nhẹ (nhỏ, dễ khắc phục ngay)',
  2: 'Mức 2 – Nhẹ (nhắc nhở vận hành nội bộ)',
  3: 'Mức 3 – Trung bình (ảnh hưởng trải nghiệm khách)',
  4: 'Mức 4 – Nặng (vi phạm ATTP / dịch vụ lớn)',
  5: 'Mức 5 – Rất nghiêm trọng (pháp lý, an toàn, đình chỉ)',
}

const IMPACT_OPTIONS = IMPACT_LEVELS.map((v) => ({
  value: v,
  label: IMPACT_LABELS[v] ?? `Mức ${v}`,
}))

export interface CriterionFormModalProps {
  open: boolean
  criterion?: Criterion
  groups: readonly CriterionGroup[]
  defaultGroupId?: number
  onClose: () => void
}

function emptyValues(groupId?: number): CriterionFormValues {
  return {
    groupId: groupId ?? null,
    code: '',
    name: '',
    checkMethod: '',
    evidenceRequired: '',
    baseImpact: 1,
    sortOrder: 0,
    active: true,
    templateIds: [],
  }
}

export function CriterionFormModal({ open, criterion, groups, defaultGroupId, onClose }: CriterionFormModalProps) {
  const notify = useNotify()
  const save = useSaveCriterion()
  const templates = useTemplateOptions(open)
  const { control, handleSubmit, reset, setError } = useForm<CriterionFormValues>({
    resolver: zodResolver(criterionSchema),
    defaultValues: emptyValues(defaultGroupId),
  })

  useEffect(() => {
    if (!open) return
    reset(
      criterion
        ? {
            groupId: criterion.groupId,
            code: criterion.code,
            name: criterion.name,
            checkMethod: criterion.checkMethod ?? '',
            evidenceRequired: criterion.evidenceRequired ?? '',
            baseImpact: criterion.baseImpact,
            sortOrder: criterion.sortOrder,
            active: criterion.active,
            templateIds: criterion.templates?.map((t) => t.id) ?? [],
          }
        : emptyValues(defaultGroupId),
    )
  }, [open, criterion, defaultGroupId, reset])

  const onSubmit = handleSubmit((v) =>
    save.mutate(
      {
        id: criterion?.id,
        body: {
          ...v,
          groupId: v.groupId ?? 0,
          checkMethod: v.checkMethod || undefined,
          evidenceRequired: v.evidenceRequired || undefined,
          templateIds: v.templateIds ?? [],
        },
      },
      {
        onSuccess: () => {
          notify.success(criterion ? 'Đã cập nhật tiêu chí' : 'Đã thêm tiêu chí')
          onClose()
        },
        onError: (err) => {
          if (!applyFieldErrors(err, setError)) notify.error(getErrorMessage(err))
        },
      },
    ),
  )

  const groupOptions = groups
    .filter((g) => g.active || g.id === criterion?.groupId)
    .map((g) => ({
      value: g.id,
      label: `${g.code} – ${g.name}${g.companyName ? ` (${g.companyName})` : ''}`,
    }))

  // Nhóm riêng của một công ty → chỉ chọn được mẫu của đúng công ty đó (server cũng kiểm tra).
  // Mẫu đã ngưng / khác công ty vẫn hiện nếu tiêu chí đang nằm trong mẫu, để bỏ chọn được.
  const groupId = useWatch({ control, name: 'groupId' })
  const selectedTemplateIds = useWatch({ control, name: 'templateIds' })
  const groupCompanyId = groups.find((g) => g.id === groupId)?.companyId ?? null
  const templateOptions = useMemo(() => {
    const selected = new Set(selectedTemplateIds ?? [])
    return (templates.data ?? [])
      .filter((t) => {
        const fits = t.active && (groupCompanyId === null || t.companyId === groupCompanyId)
        return fits || selected.has(t.id)
      })
      .map((t) => {
        const note = !t.active ? ' (đã ngưng)' : groupCompanyId !== null && t.companyId !== groupCompanyId ? ' (khác công ty)' : ''
        return { value: t.id, label: `${t.code} – ${t.name}${note}` }
      })
  }, [templates.data, groupCompanyId, selectedTemplateIds])

  return (
    <Modal
      open={open}
      title={criterion ? `Sửa tiêu chí ${criterion.code}` : 'Thêm tiêu chí'}
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
        <button type="submit" hidden />
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <FormSelect<CriterionFormValues, number>
              control={control}
              name="groupId"
              label="Nhóm tiêu chí"
              required
              showSearch={{ optionFilterProp: 'label' }}
              placeholder="Chọn nhóm tiêu chí"
              options={groupOptions}
            />
          </Col>
          <Col xs={24} md={6}>
            <FormInput
              control={control}
              name="code"
              label="Mã tiêu chí"
              required
              maxLength={30}
              placeholder="VD: VS-01"
            />
          </Col>
          <Col xs={24} md={6}>
            <FormNumber control={control} name="sortOrder" label="Thứ tự" required min={0} max={9999} precision={0} />
          </Col>
          <Col span={24}>
            <FormInput control={control} name="name" label="Tên tiêu chí con" required maxLength={300} placeholder="VD: Sàn nhà sạch sẽ, khô ráo..." />
          </Col>
          <Col span={24}>
            <FormSelect<CriterionFormValues, number[]>
              control={control}
              name="templateIds"
              label="Mẫu phiếu áp dụng"
              mode="multiple"
              showSearch={{ optionFilterProp: 'label' }}
              placeholder="Chọn các mẫu phiếu áp dụng tiêu chí này (tuỳ chọn)"
              options={templateOptions}
              allowClear
              extra="Tiêu chí sẽ tự động được đưa vào danh sách kiểm tra của các mẫu phiếu đã chọn."
            />
          </Col>
          <Col span={24}>
            <FormTextarea control={control} name="checkMethod" label="Cách kiểm tra" autoSize={{ minRows: 2, maxRows: 6 }} maxLength={4000} />
          </Col>
          <Col span={24}>
            <FormTextarea
              control={control}
              name="evidenceRequired"
              label="Bằng chứng yêu cầu"
              autoSize={{ minRows: 2, maxRows: 6 }}
              maxLength={4000}
              extra="Khi chấm Không đạt luôn bắt buộc mô tả lỗi và ảnh/video; ở đây ghi rõ cần chụp gì."
            />
          </Col>
          <Col xs={24} md={12}>
            <FormSelect<CriterionFormValues, number>
              control={control}
              name="baseImpact"
              label="Mức ảnh hưởng gốc"
              required
              options={IMPACT_OPTIONS}
              extra="Điểm rủi ro = mức ảnh hưởng × tần suất lỗi"
            />
          </Col>
          <Col xs={24} md={12}>
            <FormSwitch control={control} name="active" label="Đang hoạt động" />
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

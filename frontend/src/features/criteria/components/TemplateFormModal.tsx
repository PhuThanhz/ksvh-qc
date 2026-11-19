import { zodResolver } from '@hookform/resolvers/zod'
import { Col, Form, Modal, Row, Spin } from 'antd'
import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { FormField } from '@/components/data-entry/FormField'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormNumber } from '@/components/data-entry/FormNumber'
import { FormSelect } from '@/components/data-entry/FormSelect'
import { FormSwitch } from '@/components/data-entry/FormSwitch'
import { useNotify } from '@/components/feedback/useNotify'
import { TemplateCriteriaTransfer, type TransferItem } from '@/features/criteria/components/TemplateCriteriaTransfer'
import type { Criterion } from '@/features/criteria/criteria.types'
import { useCriterionOptions } from '@/features/criteria/hooks/useCriteria'
import { useSaveTemplate, useTemplate } from '@/features/criteria/hooks/useTemplates'
import { templateSchema, type TemplateFormValues } from '@/features/criteria/schemas/criteria.schema'
import { useCompanies } from '@/features/organizations/hooks/useOrganizations'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'

const EMPTY: TemplateFormValues = {
  code: '', name: '', companyId: null, inspectionType: '', description: '', criterionIds: [], active: true,
  frequencyPeriodMonths: 6, escalationThresholdCount: 3, resetPeriodMonths: 6,
}

export interface TemplateFormModalProps {
  open: boolean
  templateId?: number
  onClose: () => void
}

export function TemplateFormModal({ open, templateId, onClose }: TemplateFormModalProps) {
  const notify = useNotify()
  const save = useSaveTemplate()
  const detail = useTemplate(open ? templateId : undefined)
  const options = useCriterionOptions(open)
  const companies = useCompanies({ page: 0, size: 100, active: true })
  const editing = templateId !== undefined
  const { control, handleSubmit, reset, setError } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (!open) return
    const t = detail.data
    if (editing && !t) return
    reset(t ? {
      code: t.code, name: t.name, companyId: t.companyId ?? null,
      inspectionType: t.inspectionType ?? '', description: t.description ?? '',
      criterionIds: t.criteria.map((c) => c.id), active: t.active,
      frequencyPeriodMonths: t.frequencyPeriodMonths ?? 6,
      escalationThresholdCount: t.escalationThresholdCount ?? 3,
      resetPeriodMonths: t.resetPeriodMonths ?? 6,
    } : EMPTY)
  }, [open, editing, detail.data, reset])

  const companyOptions = useMemo(() => {
    const list = (companies.data?.items ?? []).map((c) => ({ value: c.id, label: `${c.code} – ${c.name}` }))
    const curCompanyId = detail.data?.companyId
    const curCompanyName = detail.data?.companyName
    if (curCompanyId && curCompanyName && !list.some((o) => o.value === curCompanyId)) {
      list.unshift({ value: curCompanyId, label: curCompanyName })
    }
    return list
  }, [companies.data, detail.data])

  const companyId = useWatch({ control, name: 'companyId' }) ?? null
  const selectedIds = useWatch({ control, name: 'criterionIds' })
  const all = useMemo<Criterion[]>(() => {
    const selected = new Set(selectedIds ?? [])
    const fits = (c: Criterion) => c.groupCompanyId === null || c.groupCompanyId === companyId
    const active = (options.data ?? []).filter((c) => fits(c) || selected.has(c.id))
    const extra = (detail.data?.criteria ?? []).filter((c) => !active.some((a) => a.id === c.id) && selected.has(c.id))
    return [...active, ...extra]
  }, [options.data, detail.data, companyId, selectedIds])

  const items = useMemo<TransferItem[]>(
    () => all.map((c) => ({
      key: String(c.id),
      title: `${c.code} – ${c.name}${!c.active ? ' (đã ngưng)' : c.groupCompanyId !== null && c.groupCompanyId !== companyId ? ' (khác công ty)' : ''}`,
      description: c.groupName ?? '', groupId: c.groupId, impact: c.baseImpact,
    })),
    [all, companyId],
  )

  const groupOptions = useMemo(() => {
    const counts = new Map<number, number>()
    const map = new Map<number, string>()
    for (const c of all) {
      if (c.groupId) {
        counts.set(c.groupId, (counts.get(c.groupId) ?? 0) + 1)
        if (c.groupName && !map.has(c.groupId)) map.set(c.groupId, c.groupName)
      }
    }
    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label: `${label} (${counts.get(value) ?? 0} tiêu chí)`,
    }))
  }, [all])

  const onSubmit = handleSubmit((v) => {
    const pos = new Map(all.map((c, i) => [c.id, i]))
    const ordered = [...v.criterionIds].sort((a, b) => (pos.get(a) ?? 0) - (pos.get(b) ?? 0))
    save.mutate(
      {
        id: templateId,
        body: {
          ...v, companyId: v.companyId ?? undefined, criterionIds: ordered,
          inspectionType: v.inspectionType || undefined,
          description: v.description || undefined,
          frequencyPeriodMonths: v.frequencyPeriodMonths ?? 6,
          escalationThresholdCount: v.escalationThresholdCount ?? 3,
          resetPeriodMonths: v.resetPeriodMonths ?? 6,
        },
      },
      {
        onSuccess: () => {
          notify.success(editing ? 'Đã cập nhật mẫu phiếu' : 'Đã tạo mẫu phiếu')
          onClose()
        },
        onError: (err) => {
          if (!applyFieldErrors(err, setError)) notify.error(getErrorMessage(err))
        },
      },
    )
  })

  const loading = (editing && detail.isLoading) || options.isLoading

  return (
    <Modal
      open={open}
      title={editing ? 'Sửa mẫu phiếu' : 'Tạo mẫu phiếu'}
      okText="Lưu"
      cancelText="Huỷ"
      width={960}
      centered
      styles={{ body: { maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', paddingRight: 4 } }}
      confirmLoading={save.isPending}
      okButtonProps={{ disabled: loading }}
      onOk={() => void onSubmit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Spin spinning={loading}>
        <Form layout="vertical" onFinish={() => void onSubmit()}>
          <button type="submit" hidden />
          <Row gutter={16}>
            <Col xs={24} md={6}><FormInput control={control} name="code" label="Mã" required maxLength={30} /></Col>
            <Col xs={24} md={18}><FormInput control={control} name="name" label="Tên mẫu phiếu" required maxLength={200} /></Col>
            <Col xs={24} md={12}>
              <FormSelect
                control={control}
                name="companyId"
                label="Công ty áp dụng"
                placeholder="Dùng chung toàn hệ thống (mọi công ty)"
                allowClear
                showSearch={{ optionFilterProp: 'label' }}
                options={companyOptions}
                loading={companies.isLoading}
                extra="Để trống nếu mẫu phiếu dùng chung cho toàn bộ các công ty"
              />
            </Col>
            <Col xs={24} md={6}><FormInput control={control} name="inspectionType" label="Loại kiểm tra" maxLength={100} placeholder="VD: Định kỳ, Đột xuất" /></Col>
            <Col xs={24} md={18}><FormInput control={control} name="description" label="Mô tả" maxLength={500} /></Col>
            <Col xs={24} md={6}><FormSwitch control={control} name="active" label="Đang dùng" /></Col>
            <Col xs={24} md={8}>
              <FormNumber
                control={control}
                name="frequencyPeriodMonths"
                label="Kỳ đếm tần suất lỗi (tháng)"
                min={1}
                max={24}
                step={1}
                precision={0}
                placeholder="6"
                extra="Kỳ đếm cuốn tính số lần lỗi (mặc định 6 tháng)"
              />
            </Col>
            <Col xs={24} md={8}>
              <FormNumber
                control={control}
                name="escalationThresholdCount"
                label="Ngưỡng nâng mức rủi ro (lần)"
                min={1}
                max={10}
                step={1}
                precision={0}
                placeholder="3"
                extra="Số lần vi phạm trong kỳ để nâng mức rủi ro (mặc định 3)"
              />
            </Col>
            <Col xs={24} md={8}>
              <FormNumber
                control={control}
                name="resetPeriodMonths"
                label="Kỳ hạ lại mức gốc (tháng)"
                min={1}
                max={24}
                step={1}
                precision={0}
                placeholder="6"
                extra="Số tháng liên tục sạch lỗi để hạ về ban đầu (mặc định 6)"
              />
            </Col>
            <Col span={24}>
              <FormField
                control={control}
                name="criterionIds"
                label="Tiêu chí trong phiếu"
                required
                extra="Thứ tự trên phiếu theo thứ tự nhóm và tiêu chí trong danh mục."
                render={(field) => (
                  <TemplateCriteriaTransfer
                    all={all}
                    items={items}
                    targetKeys={(field.value as number[]) ?? []}
                    onChange={(keys) => field.onChange(keys)}
                    groupOptions={groupOptions}
                  />
                )}
              />
            </Col>
          </Row>
        </Form>
      </Spin>
    </Modal>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Col, Flex, Form, Modal, Row, Select, Space, Spin, Transfer } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { FormField } from '@/components/data-entry/FormField'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormSelect } from '@/components/data-entry/FormSelect'
import { FormSwitch } from '@/components/data-entry/FormSwitch'
import { useNotify } from '@/components/feedback/useNotify'
import { ImpactTag } from '@/features/criteria/components/ImpactTag'
import type { Criterion } from '@/features/criteria/criteria.types'
import { useCriterionOptions } from '@/features/criteria/hooks/useCriteria'
import { useSaveTemplate, useTemplate } from '@/features/criteria/hooks/useTemplates'
import { templateSchema, type TemplateFormValues } from '@/features/criteria/schemas/criteria.schema'
import { useCompanies } from '@/features/organizations/hooks/useOrganizations'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'

const EMPTY: TemplateFormValues = {
  code: '', name: '', companyId: null, inspectionType: '', description: '', criterionIds: [], active: true,
}

interface Item {
  key: string
  title: string
  description?: string
  groupId: number
  impact: number
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
  const [filterGroupId, setFilterGroupId] = useState<number>()
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

  // Tiêu chí đang hoạt động thuộc nhóm dùng chung hoặc nhóm của đúng công ty của mẫu (server cũng kiểm tra),
  // cộng tiêu chí đang được chọn (kể cả đã ngưng / khác công ty) để không mất và bỏ chọn được.
  const companyId = useWatch({ control, name: 'companyId' }) ?? null
  const selectedIds = useWatch({ control, name: 'criterionIds' })
  const all = useMemo<Criterion[]>(() => {
    const selected = new Set(selectedIds ?? [])
    const fits = (c: Criterion) => c.groupCompanyId === null || c.groupCompanyId === companyId
    const active = (options.data ?? []).filter((c) => fits(c) || selected.has(c.id))
    const extra = (detail.data?.criteria ?? []).filter((c) => !active.some((a) => a.id === c.id) && selected.has(c.id))
    return [...active, ...extra]
  }, [options.data, detail.data, companyId, selectedIds])

  const items = useMemo<Item[]>(
    () => all.map((c) => ({
      key: String(c.id),
      title: `${c.code} – ${c.name}${!c.active ? ' (đã ngưng)' : c.groupCompanyId !== null && c.groupCompanyId !== companyId ? ' (khác công ty)' : ''}`,
      description: c.groupName ?? '', groupId: c.groupId, impact: c.baseImpact,
    })),
    [all, companyId],
  )

  const groupOptions = useMemo(() => {
    const map = new Map<number, string>()
    for (const c of all) if (c.groupId && c.groupName && !map.has(c.groupId)) map.set(c.groupId, c.groupName)
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
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
          {/* Nút submit ẩn: nhấn Enter trong ô nhập sẽ lưu (nút Lưu nằm ở footer, ngoài form). */}
          <button type="submit" hidden />
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <FormInput control={control} name="code" label="Mã" required maxLength={30} />
            </Col>
            <Col xs={24} md={18}>
              <FormInput control={control} name="name" label="Tên mẫu phiếu" required maxLength={200} />
            </Col>
            <Col xs={24} md={12}>
              <FormSelect
                control={control}
                name="companyId"
                label="Công ty áp dụng"
                placeholder="Dùng chung toàn hệ thống (mọi công ty)"
                allowClear
                options={companyOptions}
                loading={companies.isLoading}
                extra="Để trống nếu mẫu phiếu dùng chung cho toàn bộ các công ty"
              />
            </Col>
            <Col xs={24} md={6}>
              <FormInput control={control} name="inspectionType" label="Loại kiểm tra" maxLength={100} placeholder="VD: Định kỳ, Đột xuất" />
            </Col>
            <Col xs={24} md={18}>
              <FormInput control={control} name="description" label="Mô tả" maxLength={500} />
            </Col>
            <Col xs={24} md={6}>
              <FormSwitch control={control} name="active" label="Đang dùng" />
            </Col>
            <Col span={24}>
              <FormField
                control={control}
                name="criterionIds"
                label="Tiêu chí trong phiếu"
                required
                extra="Thứ tự trên phiếu theo thứ tự nhóm và tiêu chí trong danh mục."
                render={(field) => {
                  const targetKeys = (field.value as number[]) ?? []
                  const addAllInGroup = () => {
                    if (!filterGroupId) return
                    const groupIds = all.filter((c) => c.groupId === filterGroupId).map((c) => c.id)
                    field.onChange(Array.from(new Set([...targetKeys, ...groupIds])))
                  }
                  const removeAllInGroup = () => {
                    if (!filterGroupId) return
                    const groupIds = new Set(all.filter((c) => c.groupId === filterGroupId).map((c) => c.id))
                    field.onChange(targetKeys.filter((id) => !groupIds.has(id)))
                  }
                  return (
                    <Flex vertical gap={8}>
                      <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
                        <Flex align="center" gap={8}>
                          <span style={{ fontSize: 13, color: '#595959' }}>Lọc nhanh theo nhóm:</span>
                          <Select
                            placeholder="Tất cả nhóm"
                            allowClear
                            style={{ width: 220 }}
                            value={filterGroupId}
                            onChange={setFilterGroupId}
                            options={groupOptions}
                          />
                        </Flex>
                        {filterGroupId && (
                          <Space size={8}>
                            <Button size="small" type="dashed" onClick={addAllInGroup}>
                              + Chọn tất cả nhóm này
                            </Button>
                            <Button size="small" type="text" danger onClick={removeAllInGroup}>
                              Bỏ chọn nhóm này
                            </Button>
                          </Space>
                        )}
                      </Flex>
                      <Transfer<Item>
                        dataSource={items}
                        targetKeys={targetKeys.map(String)}
                        onChange={(keys) => field.onChange(keys.map(Number))}
                        render={(i) => (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <ImpactTag value={i.impact} />
                            <span title={i.title}>{i.title}</span>
                          </span>
                        )}
                        showSearch={{ placeholder: 'Tìm theo mã hoặc tên tiêu chí' }}
                        filterOption={(input, i) => {
                          if (filterGroupId && i.groupId !== filterGroupId) return false
                          if (!input) return true
                          return `${i.title} ${i.description ?? ''}`.toLowerCase().includes(input.toLowerCase())
                        }}
                        titles={[`Danh mục (${items.length - targetKeys.length})`, `Đã chọn (${targetKeys.length})`]}
                        listStyle={{ width: 'calc(50% - 24px)', height: 360 }}
                        locale={{ itemUnit: 'tiêu chí', itemsUnit: 'tiêu chí', notFoundContent: 'Không có tiêu chí' }}
                      />
                    </Flex>
                  )
                }}
              />
            </Col>
          </Row>
        </Form>
      </Spin>
    </Modal>
  )
}

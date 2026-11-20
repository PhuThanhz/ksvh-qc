import { Button, Flex, Form, Input, Radio, Select, Space } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useSession } from '@/features/auth'
import { useCriterionGroups } from '@/features/criteria/hooks/useCriteria'
import { useTemplates } from '@/features/criteria/hooks/useTemplates'
import { InspectionScopeSelector } from '@/features/inspections/components/InspectionScopeSelector'
import { useInspectionMutations, usePlans } from '@/features/inspections/hooks/useInspectionData'
import {
  INSPECTION_KIND_LABEL,
  INSPECTION_MODE_LABEL,
  type InspectionCreateRequest,
} from '@/features/inspections/inspection.types'
import { useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import { useUsers } from '@/features/users/hooks/useUsers'
import { useNotify } from '@/hooks/useNotify'
import { PERMISSIONS, ROLES, usePermission } from '@/permissions'

interface Props {
  onSuccess: () => void
  onCancel: () => void
  initialValues?: Partial<InspectionCreateRequest>
}

export function InspectionSingleForm({ onSuccess, onCancel, initialValues }: Props) {
  const [form] = Form.useForm<InspectionCreateRequest>()
  const { create } = useInspectionMutations()
  const notify = useNotify()
  const { user } = useSession()
  const { can } = usePermission()
  const canPlan = can(PERMISSIONS.PLAN.CREATE)

  const plans = usePlans({ page: 0, size: 100, status: 'APPROVED' })
  const restaurants = useOrgUnits({ unitType: 'RESTAURANT', page: 0, size: 200, active: true })
  const templates = useTemplates({ page: 0, size: 200, active: true })
  const users = useUsers({ page: 0, size: 200, active: true, role: ROLES.KSVH_INSPECTOR })
  const groups = useCriterionGroups()
  const kind = Form.useWatch('inspectionType', form) ?? 'PERIODIC'
  const isPeriodic = kind === 'PERIODIC'
  const isVerification = kind === 'VERIFICATION'

  const restaurantId = Form.useWatch('restaurantId', form)
  const findingIds = Form.useWatch('findingIds', form)
  const [topicGroupIds, setTopicGroupIds] = useState<number[]>(() => initialValues?.topicGroupIds ?? [])
  const [criterionIds, setCriterionIds] = useState<number[]>(() => initialValues?.criterionIds ?? [])
  const selectedRestaurant = useMemo(
    () => restaurants.data?.items.find((r) => r.id === restaurantId),
    [restaurants.data, restaurantId],
  )

  const filteredTemplates = useMemo(() => {
    const list = templates.data?.items ?? []
    if (!selectedRestaurant?.companyId) return list
    return list.filter((t) => t.companyId == null || t.companyId === selectedRestaurant.companyId)
  }, [templates.data, selectedRestaurant])

  const filteredGroups = useMemo(() => {
    const list = (groups.data ?? []).filter((g) => g.active)
    if (!selectedRestaurant?.companyId) return list
    return list.filter((g) => g.companyId == null || g.companyId === selectedRestaurant.companyId)
  }, [groups.data, selectedRestaurant])

  useEffect(() => {
    if (!restaurantId || !selectedRestaurant) return
    const curTemplateId = form.getFieldValue('templateId') as number | undefined
    if (curTemplateId && !filteredTemplates.some((t) => t.id === curTemplateId)) {
      form.setFieldValue('templateId', undefined)
    }
  }, [restaurantId, selectedRestaurant, filteredTemplates, form])

  useEffect(() => {
    const initialInspectorId = !canPlan && user?.id ? user.id : undefined
    const pfx = initialValues?.inspectionType === 'VERIFICATION' ? 'VER' : 'PC'
    form.setFieldsValue({
      code: `${pfx}-${dayjs().format('YYYYMM')}-${Math.floor(1000 + Math.random() * 9000)}`,
      inspectionType: 'PERIODIC',
      inspectionMode: 'ON_SITE',
      inspectorId: initialInspectorId,
      ...initialValues,
    })
  }, [form, canPlan, user, initialValues])

  const onSubmit = async () => {
    try {
      const vals = await form.validateFields()
      let payload: InspectionCreateRequest
      if (vals.inspectionType === 'PERIODIC') {
        payload = { ...vals, inspectionMode: 'ON_SITE', topicGroupIds: undefined, findingIds: undefined, criterionIds: undefined }
      } else if (vals.inspectionType === 'SURPRISE') {
        if ((!vals.criterionIds || vals.criterionIds.length === 0) && (!vals.topicGroupIds || vals.topicGroupIds.length === 0)) {
          notify.error('Vui lòng chọn ít nhất một chuyên đề hoặc tiêu chí cần kiểm tra đột xuất')
          return
        }
        payload = { ...vals, templateId: undefined, findingIds: undefined }
      } else {
        payload = { ...vals, templateId: undefined, topicGroupIds: undefined, planId: undefined, criterionIds: undefined }
      }
      await create.mutateAsync(payload)
      notify.success('Khởi tạo đợt kiểm tra và phân công chuyên viên thành công')
      onSuccess()
    } catch (err: unknown) {
      notify.error((err as { message?: string })?.message ?? 'Đã xảy ra lỗi khi tạo phiếu')
    }
  }

  return (
    <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
      <Form.Item name="code" label="Mã biên bản kiểm tra" rules={[{ required: true, message: 'Vui lòng nhập mã biên bản' }]}>
        <Input placeholder="VD: PC-202611-001" />
      </Form.Item>

      <Form.Item name="inspectionType" label="Loại kiểm tra" rules={[{ required: true }]}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          options={(['PERIODIC', 'SURPRISE', 'VERIFICATION'] as const).map((k) => ({
            value: k,
            label: INSPECTION_KIND_LABEL[k],
          }))}
          onChange={(e) => {
            const newKind = e.target.value
            if (newKind === 'PERIODIC') form.setFieldValue('inspectionMode', 'ON_SITE')
            const pfx = newKind === 'VERIFICATION' ? 'VER' : 'PC'
            form.setFieldValue('code', `${pfx}-${dayjs().format('YYYYMM')}-${Math.floor(1000 + Math.random() * 9000)}`)
          }}
        />
      </Form.Item>

      {!isVerification && (
        <Form.Item
          name="planId"
          label={isPeriodic ? 'Kế hoạch kiểm tra (bắt buộc với định kỳ)' : 'Kế hoạch kiểm tra (tuỳ chọn)'}
          rules={isPeriodic ? [{ required: true, message: 'Kiểm tra định kỳ bắt buộc chọn kế hoạch đã duyệt' }] : []}
        >
          <Select
            allowClear
            placeholder="Chọn kế hoạch đã duyệt..."
            options={plans.data?.items.map((p) => ({ value: p.id, label: `${p.planCode} - ${p.title}` }))}
          />
        </Form.Item>
      )}

      <Form.Item name="restaurantId" label="Nhà hàng / Cửa hàng" rules={[{ required: true, message: 'Vui lòng chọn nhà hàng' }]}>
        <Select
          showSearch
          placeholder="Tìm và chọn nhà hàng..."
          filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
          options={restaurants.data?.items.map((r) => ({ value: r.id, label: `${r.code} - ${r.name}` }))}
        />
      </Form.Item>

      <InspectionScopeSelector
        kind={kind}
        selectedRestaurant={selectedRestaurant}
        restaurantId={restaurantId}
        filteredTemplates={filteredTemplates}
        filteredGroups={filteredGroups}
        findingIds={findingIds}
        onChangeFindingIds={(ids) => form.setFieldValue('findingIds', ids)}
        topicGroupIds={topicGroupIds}
        criterionIds={criterionIds}
        onChangeSurpriseScope={(cIds, gIds) => {
          setCriterionIds(cIds)
          setTopicGroupIds(gIds)
          form.setFieldsValue({ criterionIds: cIds, topicGroupIds: gIds })
        }}
      />
      <Form.Item name="criterionIds" noStyle />
      <Form.Item name="topicGroupIds" noStyle />

      {!isPeriodic && (
        <Form.Item name="inspectionMode" label="Hình thức" rules={[{ required: true }]}>
          <Radio.Group options={(['ON_SITE', 'REMOTE'] as const).map((m) => ({ value: m, label: INSPECTION_MODE_LABEL[m] }))} />
        </Form.Item>
      )}

      <Form.Item
        name="inspectorId"
        label="Chuyên viên KSVH"
        rules={[{ required: true, message: 'Vui lòng phân công chuyên viên' }]}
      >
        <Select
          showSearch
          placeholder="Chọn chuyên viên..."
          disabled={!canPlan}
          filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
          options={
            !canPlan && user
              ? [{ value: user.id, label: `${user.fullName} (${user.username})` }]
              : users.data?.items.map((u) => ({ value: u.id, label: `${u.fullName} (${u.username})` }))
          }
        />
      </Form.Item>

      <Form.Item name="notes" label="Ghi chú đợt kiểm tra">
        <Input.TextArea rows={2} placeholder="Ghi chú cho chuyên viên..." />
      </Form.Item>

      <Flex justify="end" style={{ marginTop: 24 }}>
        <Space>
          <Button onClick={onCancel}>Hủy</Button>
          <Button type="primary" onClick={onSubmit} loading={create.isPending}>
            Khởi tạo đợt kiểm tra
          </Button>
        </Space>
      </Flex>
    </Form>
  )
}

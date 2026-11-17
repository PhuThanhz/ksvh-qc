import { Alert, Button, Flex, Form, Input, Radio, Select, Space } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'
import { useSession } from '@/features/auth'
import { useCriterionGroups } from '@/features/criteria/hooks/useCriteria'
import { useTemplates } from '@/features/criteria/hooks/useTemplates'
import { useInspectionMutations, usePlans } from '@/features/inspections/hooks/useInspectionData'
import { INSPECTION_KIND_LABEL, INSPECTION_MODE_LABEL, type InspectionCreateRequest } from '@/features/inspections/inspection.types'
import { useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import { useUsers } from '@/features/users/hooks/useUsers'
import { useNotify } from '@/hooks/useNotify'
import { PERMISSIONS, ROLES, usePermission } from '@/permissions'

interface Props {
  onSuccess: () => void
  onCancel: () => void
}

export function InspectionSingleForm({ onSuccess, onCancel }: Props) {
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
  const kind = Form.useWatch('inspectionType', form)
  const isPeriodic = kind !== 'SURPRISE'

  const restaurantId = Form.useWatch('restaurantId', form)
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
    const curTopics = form.getFieldValue('topicGroupIds') as number[] | undefined
    if (curTopics && curTopics.length > 0) {
      const validTopicIds = curTopics.filter((id) => filteredGroups.some((g) => g.id === id))
      if (validTopicIds.length !== curTopics.length) {
        form.setFieldValue('topicGroupIds', validTopicIds)
      }
    }
  }, [restaurantId, selectedRestaurant, filteredTemplates, filteredGroups, form])

  useEffect(() => {
    const initialInspectorId = !canPlan && user?.id ? user.id : undefined
    form.setFieldsValue({
      code: `PC-${dayjs().format('YYYYMM')}-${Math.floor(1000 + Math.random() * 9000)}`,
      inspectionType: 'PERIODIC',
      inspectionMode: 'ON_SITE',
      inspectorId: initialInspectorId,
    })
  }, [form, canPlan, user])

  const onSubmit = async () => {
    try {
      const vals = await form.validateFields()
      await create.mutateAsync(
        isPeriodic
          ? { ...vals, inspectionMode: 'ON_SITE', topicGroupIds: undefined }
          : { ...vals, templateId: undefined },
      )
      notify.success('Tạo phiếu chấm và phân công chuyên viên thành công')
      onSuccess()
    } catch (err: unknown) {
      notify.error((err as { message?: string })?.message ?? 'Đã xảy ra lỗi khi tạo phiếu')
    }
  }

  return (
    <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
      <Form.Item name="code" label="Mã phiếu chấm" rules={[{ required: true, message: 'Vui lòng nhập mã phiếu' }]}>
        <Input placeholder="VD: PC-202611-001" />
      </Form.Item>

      <Form.Item name="planId" label="Kế hoạch kiểm tra (tuỳ chọn)">
        <Select
          allowClear
          placeholder="Chọn kế hoạch đã duyệt..."
          options={plans.data?.items.map((p) => ({ value: p.id, label: `${p.planCode} - ${p.title}` }))}
        />
      </Form.Item>

      <Form.Item name="restaurantId" label="Nhà hàng / Cửa hàng" rules={[{ required: true, message: 'Vui lòng chọn nhà hàng' }]}>
        <Select
          showSearch
          placeholder="Tìm và chọn nhà hàng..."
          filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
          options={restaurants.data?.items.map((r) => ({ value: r.id, label: `${r.code} - ${r.name}` }))}
        />
      </Form.Item>

      <Form.Item name="inspectionType" label="Loại kiểm tra" rules={[{ required: true }]}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          options={(['PERIODIC', 'SURPRISE'] as const).map((k) => ({ value: k, label: INSPECTION_KIND_LABEL[k] }))}
          onChange={(e) => {
            if (e.target.value === 'PERIODIC') form.setFieldValue('inspectionMode', 'ON_SITE')
          }}
        />
      </Form.Item>

      {isPeriodic ? (
        <>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            title="Định kỳ tháng: thực hiện thực tế tại nhà hàng và chấm đủ mọi tiêu chí của mẫu phiếu."
          />
          <Form.Item
            name="templateId"
            label="Mẫu phiếu chấm"
            rules={[{ required: true, message: 'Vui lòng chọn mẫu phiếu' }]}
            extra={selectedRestaurant?.companyName ? `Lọc mẫu áp dụng cho: ${selectedRestaurant.companyName}` : undefined}
          >
            <Select
              showSearch
              placeholder={selectedRestaurant ? 'Chọn mẫu phiếu đánh giá...' : 'Chọn nhà hàng trước để lọc mẫu phù hợp'}
              filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              options={filteredTemplates.map((t) => ({
                value: t.id,
                label: `${t.code} - ${t.name} (${t.criterionCount} tiêu chí) ${t.companyName ? `[${t.companyName}]` : '[Dùng chung]'}`,
              }))}
            />
          </Form.Item>
        </>
      ) : (
        <>
          <Form.Item
            name="topicGroupIds"
            label="Chuyên đề kiểm tra"
            extra={selectedRestaurant?.companyName ? `Lọc chuyên đề áp dụng cho: ${selectedRestaurant.companyName}` : 'Chỉ chấm các tiêu chí thuộc nhóm đã chọn, không kiểm lại toàn bộ.'}
            rules={[{ required: true, message: 'Chọn ít nhất một chuyên đề' }]}
          >
            <Select
              mode="multiple"
              placeholder={selectedRestaurant ? 'VD: Tồn kho, Quản lý tiền...' : 'Chọn nhà hàng trước để lọc chuyên đề'}
              optionFilterProp="label"
              options={filteredGroups.map((g) => ({
                value: g.id,
                label: `${g.name} (${g.criterionCount} tiêu chí) ${g.companyName ? `[${g.companyName}]` : '[Dùng chung]'}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="inspectionMode" label="Hình thức" rules={[{ required: true }]}>
            <Radio.Group options={(['ON_SITE', 'REMOTE'] as const).map((m) => ({ value: m, label: INSPECTION_MODE_LABEL[m] }))} />
          </Form.Item>
        </>
      )}

      <Form.Item
        name="inspectorId"
        label="Chuyên viên KSVH"
        rules={[{ required: true, message: 'Vui lòng phân công chuyên viên' }]}
        extra={!canPlan ? 'Bạn chỉ có quyền tự tạo phiếu chấm cho chính mình' : undefined}
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
            Tạo phiếu chấm
          </Button>
        </Space>
      </Flex>
    </Form>
  )
}

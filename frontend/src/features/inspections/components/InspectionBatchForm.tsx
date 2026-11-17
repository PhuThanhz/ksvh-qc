import { Alert, Button, Flex, Form, Input, Radio, Select, Space, Tag } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useSession } from '@/features/auth'
import { useCriterionGroups } from '@/features/criteria/hooks/useCriteria'
import { useTemplates } from '@/features/criteria/hooks/useTemplates'
import { useInspectionMutations, usePlans } from '@/features/inspections/hooks/useInspectionData'
import {
  INSPECTION_KIND_LABEL,
  INSPECTION_MODE_LABEL,
  type InspectionBatchCreateRequest,
} from '@/features/inspections/inspection.types'
import { useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import { useUsers } from '@/features/users/hooks/useUsers'
import { useNotify } from '@/hooks/useNotify'
import { PERMISSIONS, ROLES, usePermission } from '@/permissions'

interface Props {
  onSuccess: () => void
  onCancel: () => void
}

export function InspectionBatchForm({ onSuccess, onCancel }: Props) {
  const [form] = Form.useForm<InspectionBatchCreateRequest>()
  const { createBatch } = useInspectionMutations()
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

  const selectedRestaurantIds = Form.useWatch('restaurantIds', form) ?? []
  const [companyFilter, setCompanyFilter] = useState<number | undefined>(undefined)

  const allActiveRestaurants = useMemo(
    () => (restaurants.data?.items ?? []).filter((r) => r.active),
    [restaurants.data],
  )

  const companies = useMemo(() => {
    const map = new Map<number, string>()
    allActiveRestaurants.forEach((r) => {
      if (r.companyId && r.companyName) {
        map.set(r.companyId, r.companyName)
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [allActiveRestaurants])

  const availableRestaurants = useMemo(() => {
    if (!companyFilter) return allActiveRestaurants
    return allActiveRestaurants.filter((r) => r.companyId === companyFilter)
  }, [allActiveRestaurants, companyFilter])

  const selectAll = () => {
    const ids = availableRestaurants.map((r) => r.id)
    form.setFieldValue('restaurantIds', ids)
  }

  const clearSelection = () => {
    form.setFieldValue('restaurantIds', [])
  }

  useEffect(() => {
    const initialInspectorId = !canPlan && user?.id ? user.id : undefined
    form.setFieldsValue({
      codePrefix: `KT-${dayjs().format('YYYYMM')}`,
      inspectionType: 'PERIODIC',
      inspectionMode: 'ON_SITE',
      inspectorId: initialInspectorId,
      restaurantIds: [],
    })
  }, [form, canPlan, user])

  const onSubmit = async () => {
    try {
      const vals = await form.validateFields()
      const res = await createBatch.mutateAsync(
        isPeriodic
          ? { ...vals, inspectionMode: 'ON_SITE', topicGroupIds: undefined }
          : { ...vals, templateId: undefined },
      )
      notify.success(`Đã khởi tạo thành công ${res.length} phiếu chấm kiểm soát!`)
      onSuccess()
    } catch (err: unknown) {
      notify.error((err as { message?: string })?.message ?? 'Đã xảy ra lỗi khi tạo đợt hàng loạt')
    }
  }

  return (
    <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Tạo đợt kiểm tra hàng loạt cho nhiều nhà hàng đồng thời cùng tiêu chí và chuyên viên."
      />

      <Form.Item
        name="codePrefix"
        label="Tiền tố mã phiếu"
        rules={[{ required: true, message: 'Vui lòng nhập tiền tố mã phiếu' }]}
        extra="Mã phiếu tự động sinh: [Tiền tố]-[Mã nhà hàng] (VD: KT-202611-CH01)"
      >
        <Input placeholder="VD: KT-202611" />
      </Form.Item>

      <Form.Item name="planId" label="Kế hoạch kiểm tra (tuỳ chọn)">
        <Select
          allowClear
          placeholder="Chọn kế hoạch đã duyệt..."
          options={plans.data?.items.map((p) => ({ value: p.id, label: `${p.planCode} - ${p.title}` }))}
        />
      </Form.Item>

      <Form.Item
        label={
          <Flex justify="space-between" align="center" style={{ width: '100%' }}>
            <span>Danh sách nhà hàng kiểm tra</span>
            <Space size={4}>
              <Button size="small" type="link" onClick={selectAll}>Chọn tất cả ({availableRestaurants.length})</Button>
              <Button size="small" type="link" danger onClick={clearSelection}>Bỏ chọn</Button>
            </Space>
          </Flex>
        }
        name="restaurantIds"
        rules={[{ required: true, message: 'Vui lòng chọn ít nhất một nhà hàng' }]}
        extra={
          <Flex justify="space-between" align="center" style={{ marginTop: 4 }}>
            <span>
              Lọc thương hiệu:{' '}
              <Select
                size="small"
                allowClear
                style={{ width: 160 }}
                placeholder="Tất cả thương hiệu"
                value={companyFilter}
                onChange={setCompanyFilter}
                options={companies.map((c) => ({ value: c.id, label: c.name }))}
              />
            </span>
            {selectedRestaurantIds.length > 0 && <Tag color="processing">Đã chọn: {selectedRestaurantIds.length} nhà hàng</Tag>}
          </Flex>
        }
      >
        <Select
          mode="multiple"
          maxTagCount="responsive"
          placeholder="Chọn các nhà hàng cần kiểm tra..."
          filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
          options={availableRestaurants.map((r) => ({
            value: r.id,
            label: `${r.code} - ${r.name}${r.companyName ? ` [${r.companyName}]` : ''}`,
          }))}
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
        <Form.Item
          name="templateId"
          label="Mẫu phiếu chấm áp dụng"
          rules={[{ required: true, message: 'Vui lòng chọn mẫu phiếu' }]}
        >
          <Select
            showSearch
            placeholder="Chọn mẫu phiếu đánh giá định kỳ..."
            filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            options={templates.data?.items.map((t) => ({
              value: t.id,
              label: `${t.code} - ${t.name} (${t.criterionCount} tiêu chí) ${t.companyName ? `[${t.companyName}]` : '[Dùng chung]'}`,
            }))}
          />
        </Form.Item>
      ) : (
        <>
          <Form.Item
            name="topicGroupIds"
            label="Chuyên đề kiểm tra"
            rules={[{ required: true, message: 'Chọn ít nhất một chuyên đề' }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn các chuyên đề kiểm tra..."
              optionFilterProp="label"
              options={(groups.data ?? [])
                .filter((g) => g.active)
                .map((g) => ({
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
        label="Chuyên viên phụ trách đợt kiểm tra"
        rules={[{ required: true, message: 'Vui lòng chọn chuyên viên' }]}
        extra={!canPlan ? 'Bạn chỉ có quyền tự tạo phiếu chấm cho chính mình' : undefined}
      >
        <Select
          showSearch
          placeholder="Chọn chuyên viên..."
          disabled={!canPlan}
          filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
          options={!canPlan && user
            ? [{ value: user.id, label: `${user.fullName} (${user.username})` }]
            : users.data?.items.map((u) => ({ value: u.id, label: `${u.fullName} (${u.username})` }))}
        />
      </Form.Item>

      <Form.Item name="notes" label="Ghi chú đợt kiểm tra">
        <Input.TextArea rows={2} placeholder="Ghi chú chung cho toàn bộ đợt kiểm tra..." />
      </Form.Item>

      <Flex justify="end" style={{ marginTop: 24 }}>
        <Space>
          <Button onClick={onCancel}>Hủy</Button>
          <Button type="primary" onClick={onSubmit} loading={createBatch.isPending}>
            {selectedRestaurantIds.length > 0 ? `Khởi tạo hàng loạt (${selectedRestaurantIds.length} phiếu)` : 'Khởi tạo hàng loạt'}
          </Button>
        </Space>
      </Flex>
    </Form>
  )
}

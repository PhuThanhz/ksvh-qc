import { Alert, Button, Flex, Form, Input, Radio, Segmented, Select, Space } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useSession } from '@/features/auth'
import { useCriterionGroups } from '@/features/criteria/hooks/useCriteria'
import { useTemplates } from '@/features/criteria/hooks/useTemplates'
import { SurpriseCriteriaPicker } from './SurpriseCriteriaPicker'
import { useInspectionMutations, usePlans } from '@/features/inspections/hooks/useInspectionData'
import { INSPECTION_KIND_LABEL, INSPECTION_MODE_LABEL, type InspectionBatchCreateRequest } from '@/features/inspections/inspection.types'
import { useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import { useUsers } from '@/features/users/hooks/useUsers'
import { useNotify } from '@/hooks/useNotify'
import { PERMISSIONS, ROLES, usePermission } from '@/permissions'
import { BatchRestaurantSelector } from './batch/BatchRestaurantSelector'

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
  const [topicGroupIds, setTopicGroupIds] = useState<number[]>([])
  const [criterionIds, setCriterionIds] = useState<number[]>([])

  const [batchSurpriseMode, setBatchSurpriseMode] = useState<'TEMPLATE' | 'TOPICS'>('TOPICS')

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
      if (!isPeriodic) {
        if (!vals.templateId && (!vals.criterionIds || vals.criterionIds.length === 0) && (!vals.topicGroupIds || vals.topicGroupIds.length === 0)) {
          notify.error('Vui lòng chọn mẫu phiếu hoặc ít nhất một chuyên đề/tiêu chí cần kiểm tra đột xuất')
          return
        }
      }
      const res = await createBatch.mutateAsync(
        isPeriodic
          ? { ...vals, inspectionMode: 'ON_SITE', topicGroupIds: undefined, criterionIds: undefined }
          : { ...vals, templateId: vals.templateId || undefined },
      )
      notify.success(`Đã khởi tạo thành công ${res.length} biên bản kiểm tra KSVH!`)
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
        title="Tạo đợt kiểm tra hàng loạt cho nhiều nhà hàng đồng thời cùng tiêu chí và chuyên viên."
      />

      <Form.Item
        name="codePrefix"
        label="Tiền tố mã biên bản"
        rules={[{ required: true, message: 'Vui lòng nhập tiền tố mã biên bản' }]}
        extra="Mã biên bản tự động sinh: [Tiền tố]-[Mã cơ sở] (VD: KT-202611-CH01)"
      >
        <Input placeholder="VD: KT-202611" />
      </Form.Item>

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

      <BatchRestaurantSelector form={form} restaurants={restaurants.data?.items ?? []} />

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
          label="Mẫu phiếu kiểm tra áp dụng"
          rules={[{ required: true, message: 'Vui lòng chọn mẫu phiếu kiểm tra' }]}
        >
          <Select
            showSearch
            placeholder="Chọn mẫu phiếu đánh giá định kỳ..."
            filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            options={templates.data?.items
              ?.filter((t) => t.inspectionType !== 'SURPRISE')
              .map((t) => ({
                value: t.id,
                label: `${t.code} - ${t.name} (${t.criterionCount} tiêu chí) ${t.companyName ? `[${t.companyName}]` : '[Dùng chung]'}`,
              }))}
          />
        </Form.Item>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <Segmented
              value={batchSurpriseMode}
              onChange={(val) => {
                setBatchSurpriseMode(val as 'TEMPLATE' | 'TOPICS')
                if (val === 'TEMPLATE') {
                  form.setFieldsValue({ criterionIds: undefined, topicGroupIds: undefined })
                  setCriterionIds([])
                  setTopicGroupIds([])
                } else {
                  form.setFieldValue('templateId', undefined)
                }
              }}
              options={[
                { label: 'Chọn mẫu phiếu đột xuất', value: 'TEMPLATE' },
                { label: 'Tùy biến Chuyên đề & Tiêu chí', value: 'TOPICS' },
              ]}
            />
          </div>

          {batchSurpriseMode === 'TEMPLATE' ? (
            <Form.Item
              name="templateId"
              label="Mẫu phiếu kiểm tra đột xuất"
              rules={[{ required: true, message: 'Vui lòng chọn mẫu phiếu đột xuất' }]}
            >
              <Select
                showSearch
                placeholder="Chọn mẫu phiếu đột xuất..."
                filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                options={templates.data?.items
                  ?.filter((t) => t.inspectionType === 'SURPRISE' || !t.inspectionType)
                  .map((t) => ({
                    value: t.id,
                    label: `${t.code} - ${t.name} (${t.criterionCount} tiêu chí) ${t.companyName ? `[${t.companyName}]` : '[Dùng chung]'}`,
                  }))}
              />
            </Form.Item>
          ) : (
            <Form.Item
              label="Phạm vi kiểm tra đột xuất (Nhóm chuyên đề & Từng tiêu chí nhỏ)"
              required
              extra="Tích chọn cả nhóm hoặc tích chọn chi tiết từng tiêu chí nhỏ áp dụng cho toàn bộ các nhà hàng đã chọn."
            >
              <SurpriseCriteriaPicker
                groups={(groups.data ?? []).filter((g) => g.active)}
                selectedGroupIds={topicGroupIds}
                selectedCriterionIds={criterionIds}
                onChange={(cIds, gIds) => {
                  setCriterionIds(cIds)
                  setTopicGroupIds(gIds)
                  form.setFieldsValue({ criterionIds: cIds, topicGroupIds: gIds })
                }}
              />
            </Form.Item>
          )}
          <Form.Item name="criterionIds" noStyle />
          <Form.Item name="topicGroupIds" noStyle />
          <Form.Item name="inspectionMode" label="Hình thức" rules={[{ required: true }]}>
            <Radio.Group options={(['ON_SITE', 'REMOTE'] as const).map((m) => ({ value: m, label: INSPECTION_MODE_LABEL[m] }))} />
          </Form.Item>
        </>
      )}

      <Form.Item
        name="inspectorId"
        label="Chuyên viên phụ trách đợt kiểm tra"
        rules={[{ required: true, message: 'Vui lòng chọn chuyên viên' }]}
        extra={!canPlan ? 'Bạn chỉ có quyền khởi tạo đợt kiểm tra cho chính mình' : undefined}
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

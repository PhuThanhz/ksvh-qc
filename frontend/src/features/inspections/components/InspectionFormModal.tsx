import { Alert, Form, Input, Modal, Radio, Select } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useCriterionGroups } from '@/features/criteria/hooks/useCriteria'
import { useTemplates } from '@/features/criteria/hooks/useTemplates'
import { useInspectionMutations, usePlans } from '@/features/inspections/hooks/useInspectionData'
import { INSPECTION_KIND_LABEL, INSPECTION_MODE_LABEL, type InspectionCreateRequest } from '@/features/inspections/inspection.types'
import { useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import { useUsers } from '@/features/users/hooks/useUsers'
import { useNotify } from '@/hooks/useNotify'
import { ROLES } from '@/permissions'

interface Props {
  open: boolean
  onClose: () => void
}

export function InspectionFormModal({ open, onClose }: Props) {
  const [form] = Form.useForm<InspectionCreateRequest>()
  const { create } = useInspectionMutations()
  const notify = useNotify()

  const plans = usePlans({ page: 0, size: 100, status: 'APPROVED' })
  const restaurants = useOrgUnits({ unitType: 'RESTAURANT', page: 0, size: 200, active: true })
  const templates = useTemplates({ page: 0, size: 200, active: true })
  const users = useUsers({ page: 0, size: 200, active: true, role: ROLES.KSVH_INSPECTOR })
  const groups = useCriterionGroups()
  const kind = Form.useWatch('inspectionType', form)
  const isPeriodic = kind !== 'SURPRISE'

  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({
        code: `PC-${dayjs().format('YYYYMM')}-${Math.floor(1000 + Math.random() * 9000)}`,
        inspectionType: 'PERIODIC',
        inspectionMode: 'ON_SITE',
      })
    }
  }, [open, form])

  const onSubmit = async () => {
    try {
      const vals = await form.validateFields()
      await create.mutateAsync(isPeriodic ? { ...vals, inspectionMode: 'ON_SITE', topicGroupIds: undefined } : { ...vals, templateId: undefined })
      notify.success('Tạo phiếu chấm và phân công chuyên viên thành công')
      onClose()
    } catch (err: unknown) {
      notify.error((err as { message?: string })?.message ?? 'Đã xảy ra lỗi khi tạo phiếu')
    }
  }

  return (
    <Modal
      open={open}
      title="Tạo phiếu kiểm tra & phân công"
      onCancel={onClose}
      onOk={onSubmit}
      confirmLoading={create.isPending}
      destroyOnClose
      width={600}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
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
            onChange={(e) => { if (e.target.value === 'PERIODIC') form.setFieldValue('inspectionMode', 'ON_SITE') }}
          />
        </Form.Item>

        {isPeriodic ? (
          <>
            <Alert type="info" showIcon style={{ marginBottom: 16 }}
              title="Định kỳ tháng: thực hiện thực tế tại nhà hàng và chấm đủ mọi tiêu chí của mẫu phiếu." />
            <Form.Item name="templateId" label="Mẫu phiếu chấm" rules={[{ required: true, message: 'Vui lòng chọn mẫu phiếu' }]}>
              <Select
                showSearch
                placeholder="Chọn mẫu phiếu đánh giá..."
                filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                options={templates.data?.items.map((t) => ({ value: t.id, label: `${t.code} - ${t.name}` }))}
              />
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item name="topicGroupIds" label="Chuyên đề kiểm tra" extra="Chỉ chấm các tiêu chí thuộc nhóm đã chọn, không kiểm lại toàn bộ."
              rules={[{ required: true, message: 'Chọn ít nhất một chuyên đề' }]}>
              <Select
                mode="multiple"
                placeholder="VD: Tồn kho, Quản lý tiền..."
                optionFilterProp="label"
                options={(groups.data ?? []).filter((g) => g.active).map((g) => ({ value: g.id, label: `${g.name} (${g.criterionCount} tiêu chí)` }))}
              />
            </Form.Item>
            <Form.Item name="inspectionMode" label="Hình thức" rules={[{ required: true }]}>
              <Radio.Group options={(['ON_SITE', 'REMOTE'] as const).map((m) => ({ value: m, label: INSPECTION_MODE_LABEL[m] }))} />
            </Form.Item>
          </>
        )}

        <Form.Item name="inspectorId" label="Chuyên viên KSVH" rules={[{ required: true, message: 'Vui lòng phân công chuyên viên' }]}>
          <Select
            showSearch
            placeholder="Chọn chuyên viên..."
            filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            options={users.data?.items.map((u) => ({ value: u.id, label: `${u.fullName} (${u.username})` }))}
          />
        </Form.Item>

        <Form.Item name="notes" label="Ghi chú đợt kiểm tra">
          <Input.TextArea rows={2} placeholder="Ghi chú cho chuyên viên..." />
        </Form.Item>
      </Form>
    </Modal>
  )
}

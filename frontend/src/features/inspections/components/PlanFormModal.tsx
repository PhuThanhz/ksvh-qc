import { DatePicker, Form, Input, Modal } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import type { PlanResponse } from '@/features/inspections/inspection.types'
import { useSavePlan } from '@/features/inspections/hooks/useInspectionData'
import { useNotify } from '@/hooks/useNotify'

interface Props {
  open: boolean
  plan?: PlanResponse
  onClose: () => void
}

interface FormValues {
  planCode: string
  title: string
  dateRange: [dayjs.Dayjs, dayjs.Dayjs]
  notes?: string
}

export function PlanFormModal({ open, plan, onClose }: Props) {
  const [form] = Form.useForm<FormValues>()
  const save = useSavePlan()
  const notify = useNotify()
  const isEdit = !!plan

  useEffect(() => {
    if (open) {
      if (plan) {
        form.setFieldsValue({
          planCode: plan.planCode,
          title: plan.title,
          dateRange: [dayjs(plan.startDate), dayjs(plan.endDate)],
          notes: plan.notes,
        })
      } else {
        form.resetFields()
        form.setFieldValue('planCode', `KH-${dayjs().format('YYYYMM')}-${Math.floor(100 + Math.random() * 900)}`)
      }
    }
  }, [open, plan, form])

  const onSubmit = async () => {
    try {
      const vals = await form.validateFields()
      const startDate = vals.dateRange[0].format('YYYY-MM-DD')
      const endDate = vals.dateRange[1].format('YYYY-MM-DD')

      if (isEdit) {
        await save.mutateAsync({
          id: plan.id,
          body: { title: vals.title, startDate, endDate, notes: vals.notes },
        })
        notify.success('Cập nhật kế hoạch thành công')
      } else {
        await save.mutateAsync({
          body: { planCode: vals.planCode, title: vals.title, startDate, endDate, notes: vals.notes },
        })
        notify.success('Tạo kế hoạch kiểm tra thành công')
      }
      onClose()
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Đã xảy ra lỗi'
      notify.error(msg)
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Chỉnh sửa kế hoạch: ${plan?.planCode}` : 'Lập kế hoạch kiểm tra mới'}
      onCancel={onClose}
      onOk={onSubmit}
      confirmLoading={save.isPending}
      destroyOnClose
      width={560}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="planCode"
          label="Mã kế hoạch"
          rules={[{ required: true, message: 'Vui lòng nhập mã kế hoạch' }]}
        >
          <Input placeholder="VD: KH-202611-001" disabled={isEdit} />
        </Form.Item>

        <Form.Item
          name="title"
          label="Tiêu đề kế hoạch"
          rules={[{ required: true, message: 'Vui lòng nhập tiêu đề kế hoạch' }]}
        >
          <Input placeholder="VD: Kiểm tra định kỳ toàn hệ thống tháng 11" />
        </Form.Item>

        <Form.Item
          name="dateRange"
          label="Thời gian thực hiện"
          rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian' }]}
        >
          <DatePicker.RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item name="notes" label="Ghi chú & Mục tiêu">
          <Input.TextArea rows={3} placeholder="Ghi chú chi tiết mục tiêu đợt kiểm tra..." />
        </Form.Item>
      </Form>
    </Modal>
  )
}

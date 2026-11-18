import { CopyOutlined } from '@ant-design/icons'
import { Button, DatePicker, Flex, Form, Input, Modal, Spin } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { PlanAssignmentEditor } from '@/features/inspections/components/PlanAssignmentEditor'
import { PlanCopyModal } from '@/features/inspections/components/PlanCopyModal'
import { usePlan, useSavePlan } from '@/features/inspections/hooks/useInspectionData'
import type { PlanAssignmentRequest, PlanResponse } from '@/features/inspections/inspection.types'
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
  assignments: PlanAssignmentRequest[]
}

export function PlanFormModal({ open, plan, onClose }: Props) {
  const [form] = Form.useForm<FormValues>()
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const save = useSavePlan()
  const notify = useNotify()
  const isEdit = !!plan
  const planDetail = usePlan(open && plan ? plan.id : undefined)
  const dateRange = Form.useWatch('dateRange', form)

  useEffect(() => {
    if (open) {
      if (plan) {
        const p = planDetail.data ?? plan
        const rawAssignments: PlanAssignmentRequest[] = (p.assignments ?? []).map((a) => ({
          restaurantId: a.restaurantId,
          inspectorId: a.inspectorId,
          templateId: a.templateId,
          scheduledDate: a.scheduledDate,
        }))
        form.setFieldsValue({
          planCode: p.planCode,
          title: p.title,
          dateRange: [dayjs(p.startDate), dayjs(p.endDate)],
          notes: p.notes,
          assignments: rawAssignments,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({
          planCode: `KH-${dayjs().format('YYYYMM')}-${Math.floor(100 + Math.random() * 900)}`,
          assignments: [],
        })
      }
    }
  }, [open, plan, planDetail.data, form])

  const onSubmit = async () => {
    try {
      const vals = await form.validateFields()
      const startDate = vals.dateRange[0].format('YYYY-MM-DD')
      const endDate = vals.dateRange[1].format('YYYY-MM-DD')
      const assignments = vals.assignments ?? []

      for (let i = 0; i < assignments.length; i++) {
        const a = assignments[i]
        if (!a || !a.restaurantId || !a.inspectorId || !a.templateId || !a.scheduledDate) {
          notify.error(`Dòng phân công #${i + 1} chưa điền đủ thông tin (nhà hàng, chuyên viên, mẫu, ngày)`)
          return
        }
        if (
          dayjs(a.scheduledDate).isBefore(vals.dateRange[0], 'day') ||
          dayjs(a.scheduledDate).isAfter(vals.dateRange[1], 'day')
        ) {
          notify.error(`Ngày kiểm tra ở dòng #${i + 1} nằm ngoài khoảng thời gian kế hoạch`)
          return
        }
      }

      const restIds = assignments.map((x) => x.restaurantId)
      if (new Set(restIds).size !== restIds.length) {
        notify.error('Có nhà hàng bị phân công trùng lặp trong kế hoạch')
        return
      }

      if (isEdit) {
        await save.mutateAsync({
          id: plan.id,
          body: { title: vals.title, startDate, endDate, notes: vals.notes, assignments },
        })
        notify.success('Cập nhật kế hoạch thành công')
      } else {
        await save.mutateAsync({
          body: { planCode: vals.planCode, title: vals.title, startDate, endDate, notes: vals.notes, assignments },
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
      destroyOnHidden
      width={880}
    >
      <Spin spinning={isEdit && planDetail.isLoading}>
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
            <Input.TextArea rows={2} placeholder="Ghi chú chi tiết mục tiêu đợt kiểm tra..." />
          </Form.Item>

          <Flex justify="flex-end" style={{ marginBottom: 8 }}>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => setCopyModalOpen(true)}
            >
              Sao chép từ kế hoạch khác
            </Button>
          </Flex>

          <Form.Item name="assignments" style={{ marginBottom: 0 }}>
            <PlanAssignmentEditor dateRange={dateRange} />
          </Form.Item>
        </Form>
      </Spin>

      <PlanCopyModal
        open={copyModalOpen}
        currentPlanId={plan?.id}
        defaultDate={dateRange?.[0]?.format('YYYY-MM-DD')}
        onClose={() => setCopyModalOpen(false)}
        onCopy={(copied) => {
          const current = form.getFieldValue('assignments') ?? []
          form.setFieldValue('assignments', [...current, ...copied])
        }}
      />
    </Modal>
  )
}

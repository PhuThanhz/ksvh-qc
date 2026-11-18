import { useQueryClient } from '@tanstack/react-query'
import { Alert, DatePicker, Form, Input, Modal, Radio } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { findingsApi } from '@/features/inspections/api/inspection.api'
import type { FindingResponse } from '@/features/inspections/inspection.types'
import { useNotify } from '@/hooks/useNotify'

export type BatchActionType = 'CONFIRM' | 'PLAN' | 'VERIFY'

interface Props {
  open: boolean
  actionType?: BatchActionType
  findings: FindingResponse[]
  onClose: () => void
  onSuccess: () => void
}

export function FindingBatchActionModal({ open, actionType, findings, onClose, onSuccess }: Props) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const notify = useNotify()
  const qc = useQueryClient()

  if (!actionType) return null

  const title =
    actionType === 'CONFIRM'
      ? `Xác nhận nhận lỗi hàng loạt (${findings.length} lỗi)`
      : actionType === 'PLAN'
        ? `Lập kế hoạch khắc phục chung (${findings.length} lỗi)`
        : `Nghiệm thu đóng lỗi hàng loạt (${findings.length} lỗi)`

  const handleSubmit = async () => {
    try {
      const vals = await form.validateFields()
      setLoading(true)
      const ids = findings.map((f) => f.id)

      if (actionType === 'CONFIRM') {
        const res = await findingsApi.batchConfirm({
          findingIds: ids,
          agreed: true,
          note: vals.note,
        })
        handleResult(res.successCount, res.failedCount, res.errors, 'xác nhận')
      } else if (actionType === 'PLAN') {
        const res = await findingsApi.batchRemediationPlan({
          findingIds: ids,
          remediationPlan: vals.remediationPlan,
          targetDate: vals.targetDate.format('YYYY-MM-DD'),
        })
        handleResult(res.successCount, res.failedCount, res.errors, 'lập kế hoạch cho')
      } else if (actionType === 'VERIFY') {
        const res = await findingsApi.batchVerify({
          findingIds: ids,
          approved: vals.approved,
          note: vals.note,
        })
        handleResult(res.successCount, res.failedCount, res.errors, 'nghiệm thu')
      }

      await qc.invalidateQueries({ queryKey: ['inspections'] })
      form.resetFields()
      onSuccess()
      onClose()
    } catch (err: unknown) {
      notify.error((err as { message?: string })?.message ?? 'Đã có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const handleResult = (success: number, failed: number, errors: string[], verb: string) => {
    if (failed === 0) {
      notify.success(`Đã ${verb} thành công ${success} lỗi vi phạm`)
    } else {
      notify.warning(`Đã ${verb} ${success}/${success + failed} lỗi. Lỗi: ${errors.join(', ')}`)
    }
  }

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      destroyOnHidden
      width={560}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        {actionType === 'CONFIRM' && (
          <>
            <Alert
              type="info"
              showIcon
              message="Xác nhận lỗi vi phạm"
              description={`Bạn đang xác nhận đồng ý nhận ${findings.length} lỗi vi phạm đã chọn. Hệ thống sẽ ghi nhận lịch sử và chuyển trạng thái sang Đã xác nhận.`}
              style={{ marginBottom: 16 }}
            />
            <Form.Item name="note" label="Ghi chú xác nhận (tuỳ chọn)">
              <Input.TextArea rows={3} placeholder="Nhập ghi chú phản hồi của nhà hàng..." />
            </Form.Item>
          </>
        )}

        {actionType === 'PLAN' && (
          <>
            <Alert
              type="info"
              showIcon
              message="Kế hoạch khắc phục hàng loạt"
              description={`Áp dụng chung kế hoạch khắc phục và thời hạn hoàn thành cho ${findings.length} lỗi vi phạm.`}
              style={{ marginBottom: 16 }}
            />
            <Form.Item
              name="remediationPlan"
              label="Biện pháp khắc phục"
              rules={[{ required: true, message: 'Vui lòng nhập kế hoạch khắc phục' }]}
            >
              <Input.TextArea rows={3} placeholder="Nêu rõ phương án, hành động cụ thể để khắc phục triệt để..." />
            </Form.Item>
            <Form.Item
              name="targetDate"
              label="Hạn cam kết hoàn thành"
              rules={[{ required: true, message: 'Vui lòng chọn ngày hoàn thành' }]}
            >
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                disabledDate={(d) => d.isBefore(dayjs(), 'day')}
              />
            </Form.Item>
          </>
        )}

        {actionType === 'VERIFY' && (
          <>
            <Alert
              type="info"
              showIcon
              message="Nghiệm thu kết quả khắc phục"
              description={`Đánh giá kết quả khắc phục cho ${findings.length} lỗi vi phạm đã nộp bằng chứng.`}
              style={{ marginBottom: 16 }}
            />
            <Form.Item
              name="approved"
              label="Kết quả nghiệm thu"
              initialValue={true}
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Radio value={true}>Đạt (Đóng lỗi thành công)</Radio>
                <Radio value={false}>Không đạt (Yêu cầu khắc phục lại)</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="note" label="Nhận xét của Chuyên viên KSVH">
              <Input.TextArea rows={3} placeholder="Ghi nhận đánh giá thực tế hoặc lý do chưa đạt..." />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  )
}

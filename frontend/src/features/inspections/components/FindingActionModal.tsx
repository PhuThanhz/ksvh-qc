import { DatePicker, Form, Input, Modal, Radio } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useFindingMutations } from '@/features/inspections/hooks/useInspectionData'
import type { FindingResponse } from '@/features/inspections/inspection.types'
import { useNotify } from '@/hooks/useNotify'

export type FindingActionType = 'CONFIRM' | 'APPEAL' | 'CONCLUDE_APPEAL' | 'REMEDIATION_PLAN' | 'SUBMIT_REMEDIATION' | 'VERIFY'

interface Props {
  open: boolean
  action?: FindingActionType
  finding?: FindingResponse
  onClose: () => void
}

export function FindingActionModal({ open, action, finding, onClose }: Props) {
  const [form] = Form.useForm()
  const { confirm, appeal, concludeAppeal, remediationPlan, submitRemediation, verify } = useFindingMutations()
  const notify = useNotify()

  useEffect(() => {
    if (open) {
      form.resetFields()
      if (action === 'REMEDIATION_PLAN') {
        // Mặc định = hạn khắc phục server đã tính theo mức rủi ro; CHT có thể chọn sớm hơn.
        form.setFieldValue('remediationDeadline', finding?.deadlineDate ? dayjs(finding.deadlineDate) : dayjs())
      } else if (action === 'CONCLUDE_APPEAL') {
        form.setFieldValue('conclusion', 'UPHELD')
      } else if (action === 'VERIFY') {
        form.setFieldValue('passed', true)
      }
    }
  }, [open, action, finding, form])

  const onSubmit = async () => {
    if (!finding || !action) return
    try {
      const vals = await form.validateFields()
      if (action === 'CONFIRM') {
        await confirm.mutateAsync(finding.id)
        notify.success('Đã xác nhận lỗi vi phạm')
      } else if (action === 'APPEAL') {
        await appeal.mutateAsync({ id: finding.id, body: { appealReason: vals.appealReason, appealEvidenceUrls: vals.appealEvidenceUrls } })
        notify.success('Đã gửi khiếu nại')
      } else if (action === 'CONCLUDE_APPEAL') {
        await concludeAppeal.mutateAsync({ id: finding.id, body: { conclusion: vals.conclusion } })
        notify.success('Đã kết luận thẩm định khiếu nại')
      } else if (action === 'REMEDIATION_PLAN') {
        const deadline = vals.remediationDeadline.format('YYYY-MM-DD')
        await remediationPlan.mutateAsync({ id: finding.id, body: { remediationPlan: vals.remediationPlan, remediationDeadline: deadline } })
        notify.success('Đã lập kế hoạch khắc phục')
      } else if (action === 'SUBMIT_REMEDIATION') {
        await submitRemediation.mutateAsync({ id: finding.id, body: { remediationEvidenceUrls: vals.remediationEvidenceUrls } })
        notify.success('Đã gửi bằng chứng khắc phục để nghiệm thu')
      } else if (action === 'VERIFY') {
        await verify.mutateAsync({ id: finding.id, body: { passed: vals.passed, comment: vals.comment } })
        notify.success('Đã nghiệm thu kết quả khắc phục')
      }
      onClose()
    } catch (err: unknown) {
      notify.error((err as { message?: string })?.message ?? 'Đã xảy ra lỗi')
    }
  }

  const titles: Record<FindingActionType, string> = {
    CONFIRM: 'Xác nhận lỗi vi phạm',
    APPEAL: 'Gửi khiếu nại lỗi vi phạm',
    CONCLUDE_APPEAL: 'Thẩm định & Kết luận khiếu nại',
    REMEDIATION_PLAN: 'Lập kế hoạch khắc phục lỗi',
    SUBMIT_REMEDIATION: 'Báo cáo hoàn thành & Gửi bằng chứng khắc phục',
    VERIFY: 'Nghiệm thu kết quả khắc phục',
  }

  return (
    <Modal
      open={open}
      title={action ? titles[action] : ''}
      onCancel={onClose}
      onOk={onSubmit}
      destroyOnClose
      width={560}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        {action === 'CONFIRM' && (
          <p>
            Bạn xác nhận cửa hàng đồng ý với lỗi <b>{finding?.criterionName}</b> và sẽ tiến hành lập kế hoạch khắc phục trong vòng <b>{finding?.remediationDays} ngày</b>?
          </p>
        )}

        {action === 'APPEAL' && (
          <>
            <Form.Item name="appealReason" label="Lý do khiếu nại" rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}>
              <Input.TextArea rows={3} placeholder="Giải trình nguyên nhân khách quan hoặc căn cứ khiếu nại..." />
            </Form.Item>
            <Form.Item name="appealEvidenceUrls" label="Link bằng chứng chứng minh">
              <Input placeholder="https://..." />
            </Form.Item>
          </>
        )}

        {action === 'CONCLUDE_APPEAL' && (
          <Form.Item name="conclusion" label="Kết luận thẩm định" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="UPHELD">Giữ nguyên lỗi (Bác khiếu nại - Yêu cầu khắc phục)</Radio>
              <Radio value="DISMISSED">Chấp nhận khiếu nại (Huỷ bỏ lỗi này)</Radio>
            </Radio.Group>
          </Form.Item>
        )}

        {action === 'REMEDIATION_PLAN' && (
          <>
            <Form.Item name="remediationPlan" label="Kế hoạch & Biện pháp khắc phục" rules={[{ required: true, message: 'Vui lòng nhập kế hoạch' }]}>
              <Input.TextArea rows={3} placeholder="Mô tả hành động khắc phục và phòng ngừa tái diễn..." />
            </Form.Item>
            <Form.Item
              name="remediationDeadline"
              label="Ngày hẹn hoàn thành"
              extra={finding?.deadlineDate ? `Không được sau hạn ${dayjs(finding.deadlineDate).format('DD/MM/YYYY')} của mức rủi ro ${finding.riskLevelCode}` : undefined}
              rules={[{ required: true, message: 'Vui lòng chọn ngày hẹn' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                disabledDate={(d) =>
                  d.isBefore(dayjs(), 'day') || (!!finding?.deadlineDate && d.isAfter(dayjs(finding.deadlineDate), 'day'))
                }
              />
            </Form.Item>
          </>
        )}

        {action === 'SUBMIT_REMEDIATION' && (
          <Form.Item name="remediationEvidenceUrls" label="Link hình ảnh/video bằng chứng sau khắc phục" rules={[{ required: true, message: 'Vui lòng cung cấp link ảnh/video' }]}>
            <Input placeholder="https://..." />
          </Form.Item>
        )}

        {action === 'VERIFY' && (
          <>
            <Form.Item name="passed" label="Kết quả nghiệm thu" rules={[{ required: true }]}>
              <Radio.Group>
                <Radio value={true}>Đạt yêu cầu (Đóng lỗi vi phạm)</Radio>
                <Radio value={false}>Chưa đạt (Yêu cầu làm lại)</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="comment" label="Nhận xét nghiệm thu">
              <Input.TextArea rows={2} placeholder="Nhận xét đánh giá sau khi kiểm tra lại..." />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  )
}

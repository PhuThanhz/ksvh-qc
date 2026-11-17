import { UploadOutlined } from '@ant-design/icons'
import { Button, DatePicker, Form, Input, Modal, Radio, Space } from 'antd'
import dayjs from 'dayjs'
import { type ChangeEvent, useEffect, useRef } from 'react'
import { useFindingMutations } from '@/features/inspections/hooks/useInspectionData'
import type { FindingResponse } from '@/features/inspections/inspection.types'
import { usePhotoCapture } from '@/features/media'
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
  const photo = usePhotoCapture()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentUploadFieldRef = useRef<'appealEvidenceUrls' | 'remediationEvidenceUrls'>('remediationEvidenceUrls')

  const today = dayjs()
  const remediationDays = finding?.remediationDays ?? 7
  const initialDeadline = finding?.deadlineDate ? dayjs(finding.deadlineDate) : null
  const maxDeadline = (!initialDeadline || initialDeadline.isBefore(today, 'day'))
    ? today.add(remediationDays, 'day')
    : initialDeadline

  useEffect(() => {
    if (open) {
      form.resetFields()
      if (action === 'REMEDIATION_PLAN') {
        form.setFieldValue('remediationDeadline', maxDeadline)
      } else if (action === 'CONCLUDE_APPEAL') {
        form.setFieldValue('conclusion', 'UPHELD')
      } else if (action === 'VERIFY') {
        form.setFieldValue('passed', true)
      }
    }
  }, [open, action, finding, form, maxDeadline])

  const onSelectFile = (field: 'appealEvidenceUrls' | 'remediationEvidenceUrls') => {
    currentUploadFieldRef.current = field
    fileInputRef.current?.click()
  }

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !finding) return
    try {
      const captured = await photo.process(file, [
        finding.restaurantName || 'Nhà hàng',
        finding.criterionCode || 'QC',
      ])
      if (captured) {
        const fieldName = currentUploadFieldRef.current
        const current = form.getFieldValue(fieldName) as string | undefined
        const next = current ? `${current}, ${captured.objectKey}` : captured.objectKey
        form.setFieldValue(fieldName, next)
        notify.success('Đã tải ảnh lên kho lưu trữ thành công')
      }
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

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

  const isPending =
    confirm.isPending ||
    appeal.isPending ||
    concludeAppeal.isPending ||
    remediationPlan.isPending ||
    submitRemediation.isPending ||
    verify.isPending

  return (
    <Modal
      open={open}
      title={action ? titles[action] : ''}
      onCancel={onClose}
      onOk={onSubmit}
      confirmLoading={isPending}
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
            <Form.Item
              name="appealEvidenceUrls"
              label="Ảnh / Bằng chứng chứng minh"
              extra="Có thể bấm Tải ảnh để chụp/chọn ảnh hoặc nhập URL"
            >
              <Space.Compact style={{ width: '100%' }}>
                <Input placeholder="https://... hoặc mã ảnh" />
                <Button
                  icon={<UploadOutlined />}
                  loading={photo.step === 'processing' || photo.step === 'uploading'}
                  onClick={() => onSelectFile('appealEvidenceUrls')}
                >
                  Tải ảnh
                </Button>
              </Space.Compact>
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
              extra={`Hạn tối đa: ${maxDeadline.format('DD/MM/YYYY')} (${remediationDays} ngày - Mức ${finding?.riskLevelCode})`}
              rules={[{ required: true, message: 'Vui lòng chọn ngày hẹn' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                disabledDate={(d) => d.isBefore(today, 'day') || d.isAfter(maxDeadline, 'day')}
              />
            </Form.Item>
          </>
        )}

        {action === 'SUBMIT_REMEDIATION' && (
          <Form.Item
            name="remediationEvidenceUrls"
            label="Ảnh / Bằng chứng sau khắc phục"
            extra="Có thể bấm Tải ảnh để chụp/chọn ảnh hoặc nhập URL"
            rules={[{ required: true, message: 'Vui lòng cung cấp link hoặc tải ảnh bằng chứng' }]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Input placeholder="https://... hoặc mã ảnh" />
              <Button
                icon={<UploadOutlined />}
                loading={photo.step === 'processing' || photo.step === 'uploading'}
                onClick={() => onSelectFile('remediationEvidenceUrls')}
              >
                Tải ảnh
              </Button>
            </Space.Compact>
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
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        style={{ display: 'none' }}
        accept="image/*"
      />
    </Modal>
  )
}

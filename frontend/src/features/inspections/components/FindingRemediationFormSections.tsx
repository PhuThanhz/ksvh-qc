import { UploadOutlined } from '@ant-design/icons'
import { Button, DatePicker, Form, Input, Radio, Space } from 'antd'
import type { Dayjs } from 'dayjs'

interface PlanSectionProps {
  today: Dayjs
  maxDeadline: Dayjs
  remediationDays: number
  riskLevelCode?: string
}

export function FindingRemediationPlanSection({
  today,
  maxDeadline,
  remediationDays,
  riskLevelCode,
}: PlanSectionProps) {
  return (
    <>
      <Form.Item
        name="remediationPlan"
        label="Kế hoạch & Biện pháp khắc phục"
        rules={[{ required: true, message: 'Vui lòng nhập kế hoạch' }]}
      >
        <Input.TextArea rows={3} placeholder="Mô tả hành động khắc phục và phòng ngừa tái diễn..." />
      </Form.Item>
      <Form.Item
        name="remediationDeadline"
        label="Ngày hẹn hoàn thành"
        extra={`Hạn tối đa: ${maxDeadline.format('DD/MM/YYYY')} (${remediationDays} ngày - Mức ${riskLevelCode ?? ''})`}
        rules={[{ required: true, message: 'Vui lòng chọn ngày hẹn' }]}
      >
        <DatePicker
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          disabledDate={(d) => d.isBefore(today, 'day') || d.isAfter(maxDeadline, 'day')}
        />
      </Form.Item>
    </>
  )
}

interface SubmitSectionProps {
  isPhotoProcessing: boolean
  onSelectPhoto: () => void
}

export function FindingRemediationSubmitSection({
  isPhotoProcessing,
  onSelectPhoto,
}: SubmitSectionProps) {
  return (
    <Form.Item
      name="remediationEvidenceUrls"
      label="Ảnh / Bằng chứng sau khắc phục"
      extra="Bấm Tải ảnh để chụp/chọn ảnh. Chỉ nhận ảnh tải lên qua ứng dụng."
      rules={[{ required: true, message: 'Vui lòng cung cấp link hoặc tải ảnh bằng chứng' }]}
    >
      <Space.Compact style={{ width: '100%' }}>
        <Input readOnly placeholder="Chưa có ảnh – bấm Tải ảnh" />
        <Button
          icon={<UploadOutlined />}
          loading={isPhotoProcessing}
          onClick={onSelectPhoto}
        >
          Tải ảnh
        </Button>
      </Space.Compact>
    </Form.Item>
  )
}

export function FindingVerifySection() {
  return (
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
  )
}

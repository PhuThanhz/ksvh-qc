import { Alert, Form, Input, Radio } from 'antd'
import type { FindingResponse } from '@/features/inspections/inspection.types'

interface ReviewSectionProps {
  finding?: FindingResponse
}

export function FindingReviewFormSection({ finding }: ReviewSectionProps) {
  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={`Lý do khiếu nại từ nhà hàng: ${finding?.appealReason || '—'}`}
      />
      <Form.Item name="verdict" label="Ý kiến thẩm định" rules={[{ required: true }]}>
        <Radio.Group>
          <Radio value="FINDING_VALID">Giữ lỗi (Khiếu nại sai / Đúng thực tế vi phạm)</Radio>
          <Radio value="FINDING_INVALID">Bỏ lỗi (Khiếu nại đúng / Lỗi ngoại cảnh hoặc không thỏa đáng)</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item name="comment" label="Nhận xét / Căn cứ thẩm định">
        <Input.TextArea rows={3} placeholder="Nêu rõ lý do đồng ý giữ lỗi hoặc huỷ bỏ lỗi..." />
      </Form.Item>
    </>
  )
}

export function FindingMeetingConcludeSection() {
  return (
    <>
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="Họp giải quyết bất đồng ý kiến"
        description="Các thẩm định viên không đồng thuận 100%. Quản lý KSVH chủ trì họp và đưa ra kết luận cuối cùng cùng biên bản họp."
      />
      <Form.Item name="conclusion" label="Kết luận cuối cùng" rules={[{ required: true }]}>
        <Radio.Group>
          <Radio value="UPHELD">Thống nhất giữ nguyên lỗi (Bác khiếu nại - Yêu cầu khắc phục)</Radio>
          <Radio value="DISMISSED">Thống nhất chấp nhận khiếu nại (Huỷ bỏ lỗi này)</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item
        name="meetingNotes"
        label="Biên bản cuộc họp / Căn cứ kết luận"
        rules={[{ required: true, message: 'Vui lòng nhập tóm tắt biên bản họp' }]}
      >
        <Input.TextArea rows={3} placeholder="Ghi nhận thành phần tham gia, nội dung thảo luận và kết luận thống nhất..." />
      </Form.Item>
    </>
  )
}

import { UploadOutlined } from '@ant-design/icons'
import { Alert, Button, Form, Input, Select, Space, Tag } from 'antd'
import { useCandidateReviewers } from '@/features/inspections/hooks/useInspectionData'
import type { CandidateReviewerResponse } from '@/features/inspections/inspection.types'

interface Props {
  findingId?: number
  onSelectPhoto: () => void
  isPhotoProcessing: boolean
}

export function FindingAppealFormSection({
  findingId,
  onSelectPhoto,
  isPhotoProcessing,
}: Props) {
  const { data: candidates = [], isLoading } = useCandidateReviewers(findingId)

  const candidateMap = new Map<number, CandidateReviewerResponse>(
    candidates.map((c) => [c.id, c]),
  )

  const validateReviewers = (_: unknown, values: number[]) => {
    if (!values || values.length < 2) {
      return Promise.reject(new Error('Vui lòng chọn từ 2 đến 5 người thẩm định'))
    }
    if (values.length > 5) {
      return Promise.reject(new Error('Tối đa 5 người thẩm định'))
    }
    const hasKsvh = values.some((id) => candidateMap.get(id)?.ksvhRep)
    if (!hasKsvh) {
      return Promise.reject(new Error('Bắt buộc phải có ít nhất 1 đại diện phòng KSVH'))
    }
    return Promise.resolve()
  }

  const options = candidates.map((c) => ({
    value: c.id,
    label: (
      <Space size={6}>
        <span>{c.fullName}</span>
        <span style={{ color: 'var(--app-text-secondary)', fontSize: 12 }}>({c.username})</span>
        {c.ksvhRep ? (
          <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>KSVH</Tag>
        ) : (
          <Tag color="orange" style={{ fontSize: 11, margin: 0 }}>OBM</Tag>
        )}
      </Space>
    ),
  }))

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title="Hội đồng thẩm định khiếu nại (2 – 5 người)"
        description="Chọn 2–5 người thẩm định (bắt buộc ≥ 1 đại diện KSVH). Không được chọn chuyên viên đã chấm lỗi này. 100% đồng thuận bỏ lỗi → Bỏ lỗi; 100% đồng thuận giữ lỗi → Giữ lỗi; Bất đồng ý kiến → Họp thống nhất do Quản lý KSVH chủ trì."
      />

      <Form.Item
        name="reviewerIds"
        label="Người thẩm định khiếu nại (2 – 5 người, có ≥ 1 KSVH)"
        rules={[{ validator: validateReviewers }]}
        extra="Chuyên viên đã chấm phiếu này tự động bị loại khỏi danh sách."
      >
        <Select
          mode="multiple"
          loading={isLoading}
          placeholder="Chọn từ 2 đến 5 người thẩm định..."
          options={options}
          maxTagCount="responsive"
        />
      </Form.Item>

      <Form.Item
        name="appealReason"
        label="Lý do khiếu nại"
        rules={[{ required: true, message: 'Vui lòng nhập lý do khiếu nại' }]}
      >
        <Input.TextArea rows={3} placeholder="Giải trình nguyên nhân khách quan hoặc căn cứ khiếu nại..." />
      </Form.Item>

      <Form.Item
        name="appealEvidenceUrls"
        label="Ảnh / Bằng chứng khiếu nại"
        extra="Chỉ nhận ảnh tải lên qua ứng dụng."
      >
        <Space.Compact style={{ width: '100%' }}>
          <Input readOnly placeholder="Chưa có ảnh – bấm Tải ảnh" />
          <Button icon={<UploadOutlined />} loading={isPhotoProcessing} onClick={onSelectPhoto}>
            Tải ảnh
          </Button>
        </Space.Compact>
      </Form.Item>
    </>
  )
}

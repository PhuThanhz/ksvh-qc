import { Card, Descriptions, Modal, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { InspectionItemResponse, ItemResult } from '@/features/inspections/inspection.types'
import { useInspection } from '@/features/inspections/hooks/useInspectionData'
import { formatDate } from '@/utils/format-date'
import { INSPECTION_KIND_LABEL, INSPECTION_MODE_LABEL, LOCATION_STATUS_META } from '@/features/inspections/inspection.types'

interface Props {
  open: boolean
  inspectionId?: number
  onClose: () => void
}

const RESULT_TAG: Record<ItemResult, { color: string; label: string }> = {
  PASS: { color: 'success', label: 'Đạt' },
  FAIL: { color: 'error', label: 'Không đạt' },
  NA: { color: 'default', label: 'K/A' },
  UNRATED: { color: 'warning', label: 'Chưa chấm' },
}

export function InspectionDetailModal({ open, inspectionId, onClose }: Props) {
  const { data: ins, isLoading } = useInspection(inspectionId)

  const columns: ColumnsType<InspectionItemResponse> = [
    { title: '#', key: 'idx', width: 50, render: (_, __, i) => i + 1 },
    { title: 'Nhóm', dataIndex: 'groupName', key: 'groupName', width: 140 },
    {
      title: 'Tiêu chí',
      key: 'criterion',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.criterionName}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{r.criterionCode} · Ảnh hưởng: {r.baseImpact}/5</div>
          {r.comment && <div style={{ fontSize: 13, color: '#cf1322', marginTop: 4 }}>Ghi chú: {r.comment}</div>}
        </div>
      ),
    },
    {
      title: 'Kết quả',
      dataIndex: 'result',
      key: 'result',
      width: 110,
      render: (res: ItemResult) => <Tag color={RESULT_TAG[res]?.color}>{RESULT_TAG[res]?.label}</Tag>,
    },
  ]

  return (
    <Modal
      open={open}
      title={`Chi tiết phiếu chấm: ${ins?.code || ''}`}
      onCancel={onClose}
      footer={null}
      width={780}
    >
      {ins && (
        <div style={{ marginTop: 16 }}>
          <Descriptions size="small" bordered column={2}>
            <Descriptions.Item label="Nhà hàng">{ins.restaurantName}</Descriptions.Item>
            <Descriptions.Item label="Loại kiểm tra">
              {INSPECTION_KIND_LABEL[ins.inspectionType]} · {INSPECTION_MODE_LABEL[ins.inspectionMode]}
            </Descriptions.Item>
            <Descriptions.Item label={ins.templateName ? 'Mẫu phiếu' : 'Chuyên đề'}>
              {ins.templateName ?? (ins.topicNames.join(', ') || '—')}
            </Descriptions.Item>
            <Descriptions.Item label="Chuyên viên KSVH">{ins.inspectorName}</Descriptions.Item>
            <Descriptions.Item label="Bắt đầu lúc">{formatDate(ins.checkinAt)}</Descriptions.Item>
            <Descriptions.Item label="Vị trí khi bắt đầu">
              {ins.locationStatus ? <Tag color={LOCATION_STATUS_META[ins.locationStatus].color}>{LOCATION_STATUS_META[ins.locationStatus].label}</Tag> : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Điểm tuân thủ">
              {ins.complianceScore == null ? '—' : <b>{ins.complianceScore.toLocaleString('vi-VN')}%</b>}
            </Descriptions.Item>
            <Descriptions.Item label="Khoảng cách GPS">{ins.checkinDistanceM ? `${Math.round(ins.checkinDistanceM)} mét` : '—'}</Descriptions.Item>
            <Descriptions.Item label="Tổng điểm rủi ro">
              <b>{ins.totalRiskScore} điểm</b> ({ins.maxRiskLevel || 'Không vi phạm'})
            </Descriptions.Item>
            <Descriptions.Item label="Kết quả chung">
              {ins.passedCriteria} Đạt · {ins.failedCriteria} Không đạt · {ins.naCriteria} K/A
            </Descriptions.Item>
            {ins.notes && <Descriptions.Item label="Ghi chú" span={2}>{ins.notes}</Descriptions.Item>}
          </Descriptions>

          <Card title="Danh sách tiêu chí đánh giá" size="small" style={{ marginTop: 16 }}>
            <Table
              columns={columns}
              dataSource={ins.items}
              rowKey="id"
              loading={isLoading}
              pagination={false}
              size="small"
            />
          </Card>
        </div>
      )}
    </Modal>
  )
}

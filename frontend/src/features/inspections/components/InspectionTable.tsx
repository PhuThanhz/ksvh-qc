import { CloseCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { Button, Space, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { InspectionResponse, InspectionStatus } from '@/features/inspections/inspection.types'
import { formatDate } from '@/utils/format-date'
import { INSPECTION_KIND_LABEL, INSPECTION_MODE_LABEL, type InspectionKind } from '@/features/inspections/inspection.types'

interface Props {
  data?: InspectionResponse[]
  loading?: boolean
  currentPage?: number
  pageSize?: number
  onView: (ins: InspectionResponse) => void
  onCancel: (ins: InspectionResponse) => void
}

const STATUS_TAG: Record<InspectionStatus, { color: string; label: string }> = {
  ASSIGNED: { color: 'blue', label: 'Đã phân công' },
  IN_PROGRESS: { color: 'processing', label: 'Đang chấm' },
  SUBMITTED: { color: 'purple', label: 'Đã nộp' },
  COMPLETED: { color: 'success', label: 'Hoàn thành' },
  CANCELLED: { color: 'default', label: 'Đã huỷ' },
}

export function InspectionTable({
  data,
  loading,
  currentPage = 0,
  pageSize = 20,
  onView,
  onCancel,
}: Props) {
  const columns: ColumnsType<InspectionResponse> = [
    {
      title: '#',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, i) => currentPage * pageSize + i + 1,
    },
    {
      title: 'Mã phiếu',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Nhà hàng',
      dataIndex: 'restaurantName',
      key: 'restaurantName',
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{v || '—'}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{r.templateName ?? 'Theo chuyên đề'}</div>
        </div>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'inspectionType',
      key: 'inspectionType',
      width: 140,
      render: (k: InspectionKind, r) => (
        <div>
          <Tag color={k === 'SURPRISE' ? 'orange' : 'blue'} style={{ margin: 0 }}>{INSPECTION_KIND_LABEL[k]}</Tag>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>{INSPECTION_MODE_LABEL[r.inspectionMode]}</div>
        </div>
      ),
    },
    {
      title: 'Chuyên viên',
      dataIndex: 'inspectorName',
      key: 'inspectorName',
      width: 150,
      render: (v) => v || '—',
    },
    {
      title: 'Tiến độ',
      key: 'progress',
      width: 150,
      render: (_, r) => (
        <div style={{ fontSize: 13 }}>
          <span style={{ color: '#52c41a', fontWeight: 600 }}>{r.passedCriteria} Đạt</span>
          {' · '}
          <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{r.failedCriteria} Lỗi</span>
          {' / '}
          <span>{r.totalCriteria} mục</span>
        </div>
      ),
    },
    {
      title: 'Rủi ro',
      key: 'risk',
      width: 120,
      render: (_, r) =>
        r.maxRiskLevel ? (
          <Tag color={r.maxRiskLevel === 'M4' ? 'error' : r.maxRiskLevel === 'M3' ? 'warning' : 'blue'}>
            {r.maxRiskLevel} ({r.totalRiskScore} đ)
          </Tag>
        ) : (
          <span style={{ color: '#8c8c8c' }}>—</span>
        ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (st: InspectionStatus) => <Tag color={STATUS_TAG[st]?.color}>{STATUS_TAG[st]?.label}</Tag>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (v) => formatDate(v),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, r) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button type="text" icon={<EyeOutlined />} onClick={() => onView(r)} />
          </Tooltip>
          {r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && (
            <Tooltip title="Huỷ phiếu">
              <Button type="text" danger icon={<CloseCircleOutlined />} onClick={() => onCancel(r)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={false}
      size="middle"
    />
  )
}

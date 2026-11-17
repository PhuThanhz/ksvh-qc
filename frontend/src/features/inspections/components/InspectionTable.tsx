import { CloseCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { Button, Space, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { InspectionResponse, InspectionStatus } from '@/features/inspections/inspection.types'
import { formatDate } from '@/utils/format-date'
import { INSPECTION_KIND_LABEL, INSPECTION_MODE_LABEL, type InspectionKind } from '@/features/inspections/inspection.types'
import { PERMISSIONS, usePermission } from '@/permissions'
import { formatInspectionDuration, getComplianceGrade } from '@/features/inspections/utils/inspection-metrics'

interface Props {
  data?: InspectionResponse[]
  loading?: boolean
  currentPage?: number
  pageSize?: number
  totalItems?: number
  onPageChange?: (page: number, pageSize: number) => void
  onView: (ins: InspectionResponse) => void
  onCancel: (ins: InspectionResponse) => void
}

const STATUS_TAG: Record<InspectionStatus, { color: string; label: string }> = {
  ASSIGNED: { color: 'default', label: 'Đã phân công' },
  IN_PROGRESS: { color: 'processing', label: 'Đang chấm' },
  SUBMITTED: { color: 'warning', label: 'Đã nộp' },
  AWAITING_ACK: { color: 'warning', label: 'Chờ CHT xác nhận' },
  COMPLETED: { color: 'success', label: 'Hoàn thành' },
  CANCELLED: { color: 'default', label: 'Đã huỷ' },
}

export function InspectionTable({
  data,
  loading,
  currentPage = 0,
  pageSize = 20,
  totalItems,
  onPageChange,
  onView,
  onCancel,
}: Props) {
  const { can } = usePermission()
  const canCancel = can(PERMISSIONS.INSPECTION.CANCEL)

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
      render: (v, r) => (
        <Tooltip title="Nhấp để xem chi tiết phiếu chấm">
          <Button
            type="link"
            style={{ padding: 0, height: 'auto', fontWeight: 600 }}
            onClick={() => onView(r)}
          >
            {v}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: 'Nhà hàng',
      dataIndex: 'restaurantName',
      key: 'restaurantName',
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{v || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--app-text-secondary)' }}>{r.templateName ?? 'Theo chuyên đề'}</div>
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
          <div style={{ fontSize: 12, color: 'var(--app-text-secondary)', marginTop: 2 }}>{INSPECTION_MODE_LABEL[r.inspectionMode]}</div>
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
          <span style={{ color: 'var(--app-success)', fontWeight: 600 }}>{r.passedCriteria} Đạt</span>
          {' · '}
          <span style={{ color: 'var(--app-danger)', fontWeight: 600 }}>{r.failedCriteria} Lỗi</span>
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
          <span style={{ color: 'var(--app-text-secondary)' }}>0 đ</span>
        ),
    },
    {
      title: 'Điểm & Xếp loại',
      dataIndex: 'complianceScore',
      key: 'compliance',
      width: 145,
      render: (v, r) => {
        if (v == null) return '—'
        const grade = getComplianceGrade(v, r.maxRiskLevel)
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{v.toLocaleString('vi-VN')}%</div>
            <Tag color={grade.color} style={{ fontSize: 11, margin: 0, marginTop: 2 }}>
              {grade.label}
            </Tag>
          </div>
        )
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (st: InspectionStatus) => <Tag color={STATUS_TAG[st]?.color}>{STATUS_TAG[st]?.label}</Tag>,
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (v, r) => {
        const duration = formatInspectionDuration(r.checkinAt, r.submittedAt)
        return (
          <div>
            <div>{formatDate(v)}</div>
            {duration !== '—' && (
              <div style={{ fontSize: 11, color: 'var(--app-text-secondary)' }}>Thời lượng: {duration}</div>
            )}
          </div>
        )
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 110,
      align: 'center',
      render: (_, r) => (
        <Space size={6}>
          <Tooltip title="Xem chi tiết phiếu chấm">
            <button
              type="button"
              className="action-btn action-btn-view"
              aria-label="Xem chi tiết phiếu chấm"
              onClick={() => onView(r)}
            >
              <EyeOutlined />
            </button>
          </Tooltip>
          {(r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS') && canCancel && (
            <Tooltip title="Huỷ phiếu">
              <button
                type="button"
                className="action-btn action-btn-delete"
                aria-label="Huỷ phiếu chấm"
                onClick={() => onCancel(r)}
              >
                <CloseCircleOutlined />
              </button>
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
      onRow={(r) => ({
        onDoubleClick: () => onView(r),
        style: { cursor: 'pointer' },
      })}
      pagination={
        totalItems !== undefined
          ? {
              current: currentPage + 1,
              pageSize,
              total: totalItems,
              showSizeChanger: true,
              onChange: (p, s) => onPageChange?.(p, s),
              showTotal: (total) => `Tổng ${total} phiếu`,
            }
          : false
      }
      size="middle"
    />
  )
}

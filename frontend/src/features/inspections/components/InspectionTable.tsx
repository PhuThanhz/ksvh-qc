import { CloseCircleOutlined } from '@ant-design/icons'
import { Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ActionButton, TableActions } from '@/components/data-display/TableActions'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { INSPECTION_STATUS_META } from '../constants/status'
import type { InspectionResponse, InspectionStatus } from '@/features/inspections/inspection.types'
import { formatDate } from '@/utils/format-date'
import { INSPECTION_KIND_LABEL, INSPECTION_MODE_LABEL, type InspectionKind } from '@/features/inspections/inspection.types'
import { PERMISSIONS, usePermission } from '@/permissions'
import { formatInspectionDuration, getComplianceGrade } from '@/features/inspections/utils/inspection-metrics'
import { actionColumnWidth } from '@/components/data-display/tableActions.utils'

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
      title: 'Mã biên bản',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (v: string, r: InspectionResponse) => (
        <Tooltip title="Nhấp để xem chi tiết biên bản kiểm tra">
          <Tag className="code-tag--blue" onClick={() => onView(r)}>
            {v}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Nhà hàng',
      dataIndex: 'restaurantName',
      key: 'restaurantName',
      width: 220,
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
        <span style={{ fontSize: 13 }}>
          <strong style={{ color: 'var(--app-success)' }}>{r.passedCriteria} Đạt</strong> ·{' '}
          <strong style={{ color: 'var(--app-danger)' }}>{r.failedCriteria} Vi phạm</strong> / {r.totalCriteria} mục
        </span>
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
            <strong>{v.toLocaleString('vi-VN')}%</strong>
            <div><Tag color={grade.color} style={{ fontSize: 11, margin: '2px 0 0' }}>{grade.label}</Tag></div>
          </div>
        )
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (st: InspectionStatus) => <StatusBadge status={st} meta={INSPECTION_STATUS_META} />,
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (v, r) => {
        const d = formatInspectionDuration(r.checkinAt, r.submittedAt)
        return <div><div>{formatDate(v)}</div>{d !== '—' && <div style={{ fontSize: 11, color: 'var(--app-text-secondary)' }}>Thời lượng: {d}</div>}</div>
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: actionColumnWidth(2),
      // Ghim mép phải bằng CSS sticky (.col-actions), không làm đổi bố cục các cột khác.
      className: 'col-actions',
      align: 'center' as const,
      render: (_, r) => (
        <TableActions
          recordName={r.code}
          onView={() => onView(r)}
          viewLabel="Xem chi tiết biên bản kiểm tra"
          extra={
            (r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS') && canCancel ? (
              <ActionButton
                tone="delete"
                icon={<CloseCircleOutlined />}
                tooltip="Huỷ đợt kiểm tra"
                ariaLabel={`Huỷ đợt kiểm tra ${r.code}`}
                onClick={() => onCancel(r)}
              />
            ) : null
          }
        />
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      scroll={{ x: 1820 }}
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
              showTotal: (total) => `Tổng cộng ${total} biên bản`,
            }
          : false
      }
      size="middle"
    />
  )
}

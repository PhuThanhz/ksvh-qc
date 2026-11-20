import { Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { PLAN_STATUS_META } from '../constants/status'
import { PlanActionButtons } from '@/features/inspections/components/PlanActionButtons'
import type { PlanResponse, PlanStatus } from '@/features/inspections/inspection.types'
import { formatDate } from '@/utils/format-date'
import { PERMISSIONS, usePermission } from '@/permissions'
import { actionColumnWidth } from '@/components/data-display/tableActions.utils'

interface Props {
  data?: PlanResponse[]
  loading?: boolean
  currentPage?: number
  pageSize?: number
  totalItems?: number
  onPageChange?: (page: number, pageSize: number) => void
  onView?: (plan: PlanResponse) => void
  onEdit: (plan: PlanResponse) => void
  onSubmit: (plan: PlanResponse) => void
  onApprove: (plan: PlanResponse) => void
  onReject: (plan: PlanResponse) => void
  onDelete: (plan: PlanResponse) => void
}

export function PlanTable({
  data,
  loading,
  currentPage = 0,
  pageSize = 20,
  totalItems,
  onPageChange,
  onView,
  onEdit,
  onSubmit,
  onApprove,
  onReject,
  onDelete,
}: Props) {
  const { can } = usePermission()
  const canCreate = can(PERMISSIONS.PLAN.CREATE)
  const canApprove = can(PERMISSIONS.PLAN.APPROVE)

  const columns: ColumnsType<PlanResponse> = [
    {
      title: '#',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, i) => currentPage * pageSize + i + 1,
    },
    {
      title: 'Mã kế hoạch',
      className: 'col-code',
      dataIndex: 'planCode',
      key: 'planCode',
      width: 120,
      render: (v) => <span className="code-tag--blue">{v}</span>,
    },
    {
      title: 'Loại',
      dataIndex: 'inspectionKind',
      key: 'inspectionKind',
      width: 100,
      render: (k?: string) => (
        <Tag color={k === 'SURPRISE' ? 'orange' : 'blue'}>{k === 'SURPRISE' ? 'Đột xuất' : 'Định kỳ'}</Tag>
      ),
    },
    {
      title: 'Tiêu đề kế hoạch',
      dataIndex: 'title',
      key: 'title',
      width: 240,
      render: (t, r) => (
        <div>
          {onView ? (
            <span className="cell-title-link" onClick={() => onView(r)}>
              {t}
            </span>
          ) : (
            <div style={{ fontWeight: 500 }}>{t}</div>
          )}
          {r.rejectionReason && (
            <div style={{ fontSize: 12, color: 'var(--app-danger)', marginTop: 4 }}>
              Lý do từ chối: {r.rejectionReason}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Hạn hoàn thành',
      key: 'deadline',
      width: 140,
      render: (_, r) => formatDate(r.endDate),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (st: PlanStatus) => <StatusBadge status={st} meta={PLAN_STATUS_META} />,
    },
    {
      title: 'Số cơ sở phân công',
      dataIndex: 'assignmentCount',
      key: 'assignmentCount',
      width: 150,
      align: 'center',
      render: (c?: number) => c ?? 0,
    },
    {
      title: 'Người tạo',
      dataIndex: 'createdByName',
      key: 'createdByName',
      width: 130,
      render: (v) => v || '—',
    },
    {
      title: 'Người duyệt',
      dataIndex: 'approvedByName',
      key: 'approvedByName',
      width: 130,
      render: (v) => v || '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: actionColumnWidth(4),
      // Ghim mép phải bằng CSS sticky (.col-actions), không làm đổi bố cục các cột khác.
      className: 'col-actions',
      align: 'center' as const,
      render: (_, r) => (
        <PlanActionButtons
          plan={r}
          canCreate={canCreate}
          canApprove={canApprove}
          onView={onView}
          onEdit={onEdit}
          onSubmit={onSubmit}
          onApprove={onApprove}
          onReject={onReject}
          onDelete={onDelete}
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
      scroll={{ x: 1600 }}
      pagination={
        totalItems !== undefined
          ? {
              current: currentPage + 1,
              pageSize,
              total: totalItems,
              showSizeChanger: true,
              onChange: (p, s) => onPageChange?.(p, s),
              showTotal: (total) => `Tổng ${total} kế hoạch`,
            }
          : false
      }
      size="middle"
    />
  )
}

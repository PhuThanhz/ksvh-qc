import { Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { PLAN_STATUS_META } from '../constants/status'
import { PlanActionButtons } from '@/features/inspections/components/PlanActionButtons'
import type { PlanResponse, PlanStatus } from '@/features/inspections/inspection.types'
import { formatDate } from '@/utils/format-date'
import { PERMISSIONS, usePermission } from '@/permissions'

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
      dataIndex: 'planCode',
      key: 'planCode',
      width: 120,
      render: (v) => <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{v}</span>,
    },
    {
      title: 'Tiêu đề kế hoạch',
      dataIndex: 'title',
      key: 'title',
      width: 240,
      render: (t, r) => (
        <div>
          {onView ? (
            <Typography.Link onClick={() => onView(r)} style={{ fontWeight: 500 }}>
              {t}
            </Typography.Link>
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
      title: 'Thời gian',
      key: 'period',
      width: 180,
      render: (_, r) => `${formatDate(r.startDate)} - ${formatDate(r.endDate)}`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (st: PlanStatus) => <StatusBadge status={st} meta={PLAN_STATUS_META} />,
    },
    {
      title: 'Số phân công',
      dataIndex: 'assignmentCount',
      key: 'assignmentCount',
      width: 120,
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
      width: 150,
      align: 'center',
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
      scroll={{ x: 1230 }}
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

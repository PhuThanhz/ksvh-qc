import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, EyeOutlined, SendOutlined } from '@ant-design/icons'
import { Space, Table, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { PLAN_STATUS_META } from '../constants/status'
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
      width: 140,
      render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Tiêu đề kế hoạch',
      dataIndex: 'title',
      key: 'title',
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
      width: 220,
      render: (_, r) => `${formatDate(r.startDate)} - ${formatDate(r.endDate)}`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
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
      width: 150,
      render: (v) => v || '—',
    },
    {
      title: 'Người duyệt',
      dataIndex: 'approvedByName',
      key: 'approvedByName',
      width: 150,
      render: (v) => v || '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      align: 'center',
      render: (_, r) => (
        <Space size={6}>
          {onView && (
            <Tooltip title="Xem chi tiết kế hoạch">
              <button
                type="button"
                className="action-btn action-btn-view"
                aria-label="Xem chi tiết kế hoạch"
                onClick={() => onView(r)}
              >
                <EyeOutlined />
              </button>
            </Tooltip>
          )}

          {(r.status === 'DRAFT' || r.status === 'REJECTED') && canCreate && (
            <>
              <Tooltip title="Gửi duyệt">
                <button
                  type="button"
                  className="action-btn action-btn-add"
                  aria-label="Gửi duyệt kế hoạch"
                  onClick={() => onSubmit(r)}
                >
                  <SendOutlined />
                </button>
              </Tooltip>
              <Tooltip title="Chỉnh sửa">
                <button
                  type="button"
                  className="action-btn action-btn-edit"
                  aria-label="Chỉnh sửa kế hoạch"
                  onClick={() => onEdit(r)}
                >
                  <EditOutlined />
                </button>
              </Tooltip>
              <Tooltip title="Xoá">
                <button
                  type="button"
                  className="action-btn action-btn-delete"
                  aria-label="Xoá kế hoạch"
                  onClick={() => onDelete(r)}
                >
                  <DeleteOutlined />
                </button>
              </Tooltip>
            </>
          )}

          {r.status === 'PENDING_APPROVAL' && canApprove && (
            <>
              <Tooltip title="Phê duyệt">
                <button
                  type="button"
                  className="action-btn action-btn-add"
                  aria-label="Phê duyệt kế hoạch"
                  onClick={() => onApprove(r)}
                >
                  <CheckOutlined />
                </button>
              </Tooltip>
              <Tooltip title="Từ chối">
                <button
                  type="button"
                  className="action-btn action-btn-delete"
                  aria-label="Từ chối kế hoạch"
                  onClick={() => onReject(r)}
                >
                  <CloseOutlined />
                </button>
              </Tooltip>
            </>
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

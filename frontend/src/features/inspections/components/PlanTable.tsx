import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, SendOutlined } from '@ant-design/icons'
import { Button, Space, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { PlanResponse, PlanStatus } from '@/features/inspections/inspection.types'
import { formatDate } from '@/utils/format-date'

interface Props {
  data?: PlanResponse[]
  loading?: boolean
  currentPage?: number
  pageSize?: number
  onEdit: (plan: PlanResponse) => void
  onSubmit: (plan: PlanResponse) => void
  onApprove: (plan: PlanResponse) => void
  onReject: (plan: PlanResponse) => void
  onDelete: (plan: PlanResponse) => void
}

const STATUS_TAG: Record<PlanStatus, { color: string; label: string }> = {
  DRAFT: { color: 'default', label: 'Bản nháp' },
  PENDING_APPROVAL: { color: 'warning', label: 'Chờ duyệt' },
  APPROVED: { color: 'success', label: 'Đã duyệt' },
  REJECTED: { color: 'error', label: 'Từ chối' },
}

export function PlanTable({
  data,
  loading,
  currentPage = 0,
  pageSize = 20,
  onEdit,
  onSubmit,
  onApprove,
  onReject,
  onDelete,
}: Props) {
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
          <div style={{ fontWeight: 500 }}>{t}</div>
          {r.rejectionReason && (
            <div style={{ fontSize: 12, color: '#cf1322', marginTop: 4 }}>
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
      render: (st: PlanStatus) => <Tag color={STATUS_TAG[st]?.color}>{STATUS_TAG[st]?.label}</Tag>,
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
      width: 180,
      align: 'center',
      render: (_, r) => (
        <Space size="small">
          {(r.status === 'DRAFT' || r.status === 'REJECTED') && (
            <>
              <Tooltip title="Gửi duyệt">
                <Button type="text" icon={<SendOutlined style={{ color: '#1677ff' }} />} onClick={() => onSubmit(r)} />
              </Tooltip>
              <Tooltip title="Chỉnh sửa">
                <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(r)} />
              </Tooltip>
              <Tooltip title="Xoá">
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete(r)} />
              </Tooltip>
            </>
          )}

          {r.status === 'PENDING_APPROVAL' && (
            <>
              <Tooltip title="Phê duyệt">
                <Button type="text" icon={<CheckOutlined style={{ color: '#52c41a' }} />} onClick={() => onApprove(r)} />
              </Tooltip>
              <Tooltip title="Từ chối">
                <Button type="text" danger icon={<CloseOutlined />} onClick={() => onReject(r)} />
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
      pagination={false}
      size="middle"
    />
  )
}

import {
  AuditOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  FileDoneOutlined,
  FormOutlined,
  RollbackOutlined,
} from '@ant-design/icons'
import { Button, Space, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type { FindingActionType } from '@/features/inspections/components/FindingActionModal'
import type { FindingResponse, FindingStatus } from '@/features/inspections/inspection.types'
import { formatDate } from '@/utils/format-date'
import { PERMISSIONS, usePermission } from '@/permissions'

interface Props {
  data?: FindingResponse[]
  loading?: boolean
  currentPage?: number
  pageSize?: number
  totalItems?: number
  onPageChange?: (page: number, pageSize: number) => void
  onAction: (finding: FindingResponse, action: FindingActionType) => void
  onView?: (finding: FindingResponse) => void
}

const STATUS_TAG: Record<FindingStatus, { color: string; label: string }> = {
  OPEN: { color: 'warning', label: 'Chờ phản hồi' },
  CONFIRMED: { color: 'processing', label: 'Đã xác nhận' },
  APPEALED: { color: 'warning', label: 'Đang khiếu nại' },
  APPEAL_MEETING: { color: 'magenta', label: 'Họp khiếu nại' },
  REMEDIATING: { color: 'processing', label: 'Đang khắc phục' },
  PENDING_VERIFICATION: { color: 'warning', label: 'Chờ nghiệm thu' },
  CLOSED: { color: 'success', label: 'Đã đóng' },
  DISMISSED: { color: 'default', label: 'Đã huỷ bỏ' },
}

export function FindingTable({
  data,
  loading,
  currentPage = 0,
  pageSize = 20,
  totalItems,
  onPageChange,
  onAction,
  onView,
}: Props) {
  const { can } = usePermission()
  const canRespond = can(PERMISSIONS.FINDING.RESPOND)
  const canConclude = can(PERMISSIONS.FINDING.CONCLUDE_APPEAL)
  const canRemediate = can(PERMISSIONS.FINDING.REMEDIATE)
  const canVerify = can(PERMISSIONS.FINDING.VERIFY)

  const columns: ColumnsType<FindingResponse> = [
    {
      title: '#',
      key: 'idx',
      width: 50,
      align: 'center',
      render: (_, __, i) => currentPage * pageSize + i + 1,
    },
    {
      title: 'Nhà hàng & Phiếu',
      key: 'res',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.restaurantName}</div>
          <div style={{ fontSize: 12, color: 'var(--app-text-secondary)' }}>Phiếu: {r.inspectionCode}</div>
        </div>
      ),
    },
    {
      title: 'Tiêu chí vi phạm',
      key: 'crit',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.criterionName}</div>
          <div style={{ fontSize: 12, color: 'var(--app-text-body)' }}>{r.description}</div>
          {r.appealReason && (
            <div style={{ fontSize: 12, color: 'var(--app-text-secondary)', marginTop: 2 }}>Khiếu nại: {r.appealReason}</div>
          )}
          {r.remediationPlan && (
            <div style={{ fontSize: 12, color: 'var(--app-text-secondary)', marginTop: 2 }}>KH khắc phục: {r.remediationPlan}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Mức rủi ro',
      key: 'risk',
      width: 150,
      render: (_, r) => (
        <div>
          <Tag color={r.riskLevelCode === 'M4' ? 'error' : r.riskLevelCode === 'M3' ? 'warning' : 'blue'}>
            {r.riskLevelCode} - {r.riskLevelName}
          </Tag>
          {r.effectiveImpact != null && r.effectiveImpact > r.baseImpact && (
            <div>
              <Tag color="warning" style={{ margin: '2px 0 0', fontSize: 11 }}>
                ▲ Nâng mức {r.baseImpact}→{r.effectiveImpact}
              </Tag>
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--app-text-secondary)', marginTop: 2 }}>
            Điểm: {r.calculatedScore} (lặp lại {r.violationCount} lần)
          </div>
        </div>
      ),
    },
    {
      title: 'Hạn khắc phục',
      dataIndex: 'deadlineDate',
      key: 'deadline',
      width: 125,
      render: (v, r) => {
        if (!v) return '—'
        const isOverdue =
          (r.status === 'OPEN' || r.status === 'CONFIRMED' || r.status === 'REMEDIATING') &&
          dayjs(v).isBefore(dayjs(), 'day')
        return (
          <div>
            <div>{formatDate(v)}</div>
            {isOverdue && (
              <Tag color="error" style={{ margin: '2px 0 0', fontSize: 10 }}>
                Quá hạn
              </Tag>
            )}
          </div>
        )
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (st: FindingStatus) => <Tag color={STATUS_TAG[st]?.color}>{STATUS_TAG[st]?.label}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 170,
      align: 'center',
      render: (_, r) => (
        <Space size={6}>
          {onView && (
            <Tooltip title="Xem chi tiết & lịch sử lỗi">
              <button
                type="button"
                className="action-btn action-btn-view"
                aria-label="Xem chi tiết và lịch sử lỗi"
                onClick={() => onView(r)}
              >
                <EyeOutlined />
              </button>
            </Tooltip>
          )}

          {r.status === 'OPEN' && canRespond && (
            <>
              <Tooltip title="Xác nhận nhận lỗi">
                <Button type="text" icon={<CheckCircleOutlined />} onClick={() => onAction(r, 'CONFIRM')} />
              </Tooltip>
              <Tooltip title="Khiếu nại">
                <Button type="text" icon={<RollbackOutlined />} onClick={() => onAction(r, 'APPEAL')} />
              </Tooltip>
            </>
          )}

          {r.status === 'APPEALED' && (
            <Tooltip title="Thẩm định khiếu nại">
              <Button type="text" icon={<AuditOutlined />} onClick={() => onAction(r, 'SUBMIT_REVIEW')} />
            </Tooltip>
          )}

          {r.status === 'APPEAL_MEETING' && canConclude && (
            <Tooltip title="Kết luận họp khiếu nại">
              <Button type="text" icon={<AuditOutlined />} onClick={() => onAction(r, 'CONCLUDE_APPEAL')} />
            </Tooltip>
          )}

          {r.status === 'CONFIRMED' && canRemediate && (
            <Tooltip title="Lập kế hoạch khắc phục">
              <Button type="text" icon={<FormOutlined />} onClick={() => onAction(r, 'REMEDIATION_PLAN')} />
            </Tooltip>
          )}

          {r.status === 'REMEDIATING' && canRemediate && (
            <Tooltip title="Nộp bằng chứng khắc phục">
              <Button type="text" icon={<FileDoneOutlined />} onClick={() => onAction(r, 'SUBMIT_REMEDIATION')} />
            </Tooltip>
          )}

          {r.status === 'PENDING_VERIFICATION' && canVerify && (
            <Tooltip title="Nghiệm thu đóng lỗi">
              <Button type="text" icon={<CheckCircleOutlined />} onClick={() => onAction(r, 'VERIFY')} />
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
      onRow={(record) => ({
        onDoubleClick: () => onView?.(record),
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
              showTotal: (total) => `Tổng ${total} lỗi`,
            }
          : false
      }
      size="middle"
    />
  )
}

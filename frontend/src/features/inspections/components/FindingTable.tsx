import { Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { FINDING_STATUS_META } from '../constants/status'
import { FindingActionButtons } from '@/features/inspections/components/FindingActionButtons'
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
  selectedRowKeys?: React.Key[]
  onSelectRowKeys?: (keys: React.Key[]) => void
  onPageChange?: (page: number, pageSize: number) => void
  onAction: (finding: FindingResponse, action: FindingActionType) => void
  onView?: (finding: FindingResponse) => void
}

export function FindingTable({
  data,
  loading,
  currentPage = 0,
  pageSize = 20,
  totalItems,
  selectedRowKeys,
  onSelectRowKeys,
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
      width: 200,
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
      minWidth: 260,
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
      render: (st: FindingStatus) => <StatusBadge status={st} meta={FINDING_STATUS_META} />,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 170,
      align: 'center',
      render: (_, r) => (
        <FindingActionButtons
          finding={r}
          canRespond={canRespond}
          canConclude={canConclude}
          canRemediate={canRemediate}
          canVerify={canVerify}
          onAction={onAction}
          onView={onView}
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
      scroll={{ x: 1100 }}
      rowSelection={
        onSelectRowKeys
          ? {
              selectedRowKeys,
              onChange: (keys) => onSelectRowKeys(keys),
            }
          : undefined
      }
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

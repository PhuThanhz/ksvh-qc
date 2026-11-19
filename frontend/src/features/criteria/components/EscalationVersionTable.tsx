import { DeleteOutlined } from '@ant-design/icons'
import { Flex, Table, Typography } from 'antd'
import { ActionButton } from '@/components/data-display/TableActions'
import { ConfigStatusTag } from '@/features/criteria/components/ConfigStatusTag'
import type { ConfigStatus, EscalationRule } from '@/features/criteria/criteria.types'
import { PERMISSIONS, ProtectedAction } from '@/permissions'
import { formatDate, formatDateTime } from '@/utils/format-date'

export interface EscalationVersionTableProps {
  rules: EscalationRule[]
  loading: boolean
  onDelete: (rule: EscalationRule) => void
}

/** Các phiên bản quy tắc nâng mức chung, mới nhất trước. */
export function EscalationVersionTable({ rules, loading, onDelete }: EscalationVersionTableProps) {
  return (
    <Table<EscalationRule>
      rowKey="id"
      size="small"
      loading={loading}
      dataSource={rules}
      pagination={false}
      locale={{ emptyText: 'Chưa có phiên bản nào – chưa áp dụng nâng mức' }}
      columns={[
        { title: 'Ngưỡng tái phạm', dataIndex: 'thresholdCount', render: (n: number) => `${n} lần` },
        { title: 'Mức nâng', dataIndex: 'stepIncrease', render: (n: number) => `+${n} bậc` },
        { title: 'Mức trần', dataIndex: 'maxImpact' },
        { title: 'Hạ mức sau', dataIndex: 'resetPeriodMonths', render: (n: number) => `${n} tháng sạch lỗi` },
        { title: 'Áp dụng từ', dataIndex: 'effectiveFrom', render: formatDate },
        { title: 'Trạng thái', dataIndex: 'status', render: (s: ConfigStatus) => <ConfigStatusTag status={s} /> },
        {
          title: 'Người tạo',
          key: 'by',
          render: (_: unknown, r: EscalationRule) => (
            <Flex vertical>
              <span>{r.createdByName ?? 'Hệ thống'}</span>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {formatDateTime(r.createdAt)}
              </Typography.Text>
            </Flex>
          ),
        },
        {
          title: '',
          key: 'actions',
          width: 50,
          render: (_: unknown, r: EscalationRule) =>
            r.status === 'SCHEDULED' && (
              <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
                <ActionButton tone="delete" icon={<DeleteOutlined />} tooltip="Xoá phiên bản" onClick={() => onDelete(r)} />
              </ProtectedAction>
            ),
        },
      ]}
    />
  )
}

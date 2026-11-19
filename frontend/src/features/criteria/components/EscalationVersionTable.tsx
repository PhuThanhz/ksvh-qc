import { Flex, Table, Tag, Typography } from 'antd'
import { TableActions } from '@/components/data-display/TableActions'
import { TableCard } from '@/components/data-display/TableCard'
import { actionColumnWidth } from '@/components/data-display/tableActions.utils'
import { ConfigStatusTag } from '@/features/criteria/components/ConfigStatusTag'
import { ImpactTag } from '@/features/criteria/components/ImpactTag'
import type { ConfigStatus, EscalationRule } from '@/features/criteria/criteria.types'
import { PERMISSIONS } from '@/permissions'
import { formatDate, formatDateTime } from '@/utils/format-date'

export interface EscalationVersionTableProps {
  rules: EscalationRule[]
  loading: boolean
  onView: (rule: EscalationRule) => void
  onEdit: (rule: EscalationRule) => void
  onDelete: (rule: EscalationRule) => void
}

/** Các phiên bản quy tắc nâng mức chung, mới nhất trước. */
export function EscalationVersionTable({ rules, loading, onView, onEdit, onDelete }: EscalationVersionTableProps) {
  return (
    <TableCard>
      <Table<EscalationRule>
        rowKey="id"
        size="middle"
        loading={loading}
        dataSource={rules}
        pagination={false}
        scroll={{ x: 920 }}
        locale={{ emptyText: 'Chưa có phiên bản nào – hiện chưa áp dụng nâng mức khi tái phạm' }}
        columns={[
          {
            title: '#',
            key: 'index',
            width: 56,
            align: 'center',
            render: (_, __, i) => i + 1,
          },
          {
            title: 'Ngưỡng kích hoạt tái phạm',
            dataIndex: 'thresholdCount',
            width: 200,
            render: (n: number, r) => (
              <span className="cell-title-link" onClick={() => onView(r)}>
                Từ lần vi phạm thứ {n}
              </span>
            ),
          },
          {
            title: 'Bước nâng mức',
            dataIndex: 'stepIncrease',
            width: 140,
            render: (n: number) => <Tag color="volcano">+{n} bậc / lần</Tag>,
          },
          {
            title: 'Mức trần tối đa',
            dataIndex: 'maxImpact',
            width: 140,
            render: (n: number) => <ImpactTag value={n} />,
          },
          {
            title: 'Chu kỳ hoàn nguyên',
            dataIndex: 'resetPeriodMonths',
            width: 190,
            render: (n: number) => `${n} tháng liên tục không lỗi`,
          },
          {
            title: 'Hiệu lực từ ngày',
            dataIndex: 'effectiveFrom',
            width: 145,
            render: (d: string) => <b>{formatDate(d)}</b>,
          },
          {
            title: 'Trạng thái',
            dataIndex: 'status',
            width: 140,
            render: (s: ConfigStatus) => <ConfigStatusTag status={s} />,
          },
          {
            title: 'Người thiết lập',
            key: 'by',
            width: 180,
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
            title: 'Thao tác',
            key: 'actions',
            width: actionColumnWidth(3),
            className: 'col-actions',
            align: 'center',
            render: (_: unknown, r: EscalationRule) => (
              <TableActions
                onView={() => onView(r)}
                onEdit={() => onEdit(r)}
                editLabel={r.status === 'SCHEDULED' ? 'Sửa phiên bản' : 'Tạo phiên bản mới từ bản này'}
                editAccess={PERMISSIONS.CRITERIA.MANAGE}
                onDelete={r.status === 'SCHEDULED' ? () => onDelete(r) : undefined}
                deleteAccess={PERMISSIONS.CRITERIA.MANAGE}
                deleteDisabledReason={
                  r.status !== 'SCHEDULED'
                    ? 'Chỉ xoá được phiên bản ở trạng thái "Sắp áp dụng"'
                    : undefined
                }
                recordName={`quy tắc hiệu lực từ ${formatDate(r.effectiveFrom)}`}
              />
            ),
          },
        ]}
      />
    </TableCard>
  )
}

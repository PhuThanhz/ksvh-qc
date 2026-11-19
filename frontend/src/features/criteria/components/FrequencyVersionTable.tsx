import { Flex, Table, Typography } from 'antd'
import { TableActions } from '@/components/data-display/TableActions'
import { TableCard } from '@/components/data-display/TableCard'
import { actionColumnWidth } from '@/components/data-display/tableActions.utils'
import { ConfigStatusTag } from '@/features/criteria/components/ConfigStatusTag'
import type { ConfigStatus, FrequencyConfig } from '@/features/criteria/criteria.types'
import { PERMISSIONS } from '@/permissions'
import { formatDate, formatDateTime } from '@/utils/format-date'

export interface FrequencyVersionTableProps {
  configs: FrequencyConfig[]
  loading: boolean
  onView: (config: FrequencyConfig) => void
  onEdit: (config: FrequencyConfig) => void
  onDelete: (config: FrequencyConfig) => void
}

/** Các phiên bản kỳ đếm tần suất, mới nhất trước. */
export function FrequencyVersionTable({ configs, loading, onView, onEdit, onDelete }: FrequencyVersionTableProps) {
  return (
    <TableCard>
      <Table<FrequencyConfig>
        rowKey="id"
        size="middle"
        loading={loading}
        dataSource={configs}
        pagination={false}
        scroll={{ x: 760 }}
        locale={{ emptyText: 'Chưa khai báo phiên bản kỳ đếm (mặc định hệ thống: 6 tháng)' }}
        columns={[
          {
            title: '#',
            key: 'index',
            width: 56,
            align: 'center',
            render: (_, __, i) => i + 1,
          },
          {
            title: 'Kỳ đếm tần suất',
            dataIndex: 'periodMonths',
            render: (m: number, c) => (
              <div>
                <span className="cell-title-link" onClick={() => onView(c)}>
                  {m} tháng liên tiếp
                </span>
                <div style={{ fontSize: 12, color: 'var(--app-text-secondary)' }}>
                  Tính lùi {m} tháng kể cả tháng phát sinh
                </div>
              </div>
            ),
          },
          {
            title: 'Hiệu lực từ ngày',
            dataIndex: 'effectiveFrom',
            width: 160,
            render: (d: string) => <b>{formatDate(d)}</b>,
          },
          {
            title: 'Trạng thái',
            dataIndex: 'status',
            width: 150,
            render: (s: ConfigStatus) => <ConfigStatusTag status={s} />,
          },
          {
            title: 'Người thiết lập',
            key: 'by',
            width: 200,
            render: (_: unknown, c: FrequencyConfig) => (
              <Flex vertical>
                <span>{c.createdByName ?? 'Hệ thống'}</span>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {formatDateTime(c.createdAt)}
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
            render: (_: unknown, c: FrequencyConfig) => (
              <TableActions
                onView={() => onView(c)}
                onEdit={() => onEdit(c)}
                editLabel={c.status === 'SCHEDULED' ? 'Sửa phiên bản' : 'Tạo phiên bản mới từ bản này'}
                editAccess={PERMISSIONS.CRITERIA.MANAGE}
                onDelete={c.status === 'SCHEDULED' ? () => onDelete(c) : undefined}
                deleteAccess={PERMISSIONS.CRITERIA.MANAGE}
                deleteDisabledReason={
                  c.status !== 'SCHEDULED'
                    ? 'Chỉ xoá được phiên bản ở trạng thái "Sắp áp dụng"'
                    : undefined
                }
                recordName={`kỳ đếm hiệu lực từ ${formatDate(c.effectiveFrom)}`}
              />
            ),
          },
        ]}
      />
    </TableCard>
  )
}

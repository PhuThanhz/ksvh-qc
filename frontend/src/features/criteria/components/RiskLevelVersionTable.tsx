import { Space, Table } from 'antd'
import { TableActions } from '@/components/data-display/TableActions'
import { TableCard } from '@/components/data-display/TableCard'
import { actionColumnWidth } from '@/components/data-display/tableActions.utils'
import { RiskLevelTag } from '@/components/data-display/RiskLevelTag'
import { ConfigStatusTag } from '@/features/criteria/components/ConfigStatusTag'
import type { RiskLevelVersion } from '@/features/criteria/criteria.types'
import { PERMISSIONS } from '@/permissions'
import { formatDate, formatDateTime } from '@/utils/format-date'

export interface RiskLevelVersionTableProps {
  loading: boolean
  dataSource: readonly RiskLevelVersion[]
  onView: (v: RiskLevelVersion) => void
  onEdit: (v: RiskLevelVersion) => void
  onDelete: (v: RiskLevelVersion) => void
}

export function RiskLevelVersionTable({
  loading,
  dataSource,
  onView,
  onEdit,
  onDelete,
}: RiskLevelVersionTableProps) {
  return (
    <TableCard>
      <Table<RiskLevelVersion>
        rowKey="effectiveFrom"
        size="middle"
        loading={loading}
        dataSource={dataSource as RiskLevelVersion[]}
        pagination={false}
        scroll={{ x: 980 }}
        columns={[
          {
            title: '#',
            key: 'index',
            width: 50,
            align: 'center',
            render: (_, __, i) => i + 1,
          },
          {
            title: 'Bảng phân loại rủi ro',
            key: 'title',
            width: 280,
            render: (_, v) => (
              <div>
                <span
                  className="cell-title-link"
                  onClick={() => onView(v)}
                  title="Nhấp để xem chi tiết bảng phân loại"
                >
                  Bảng phân loại mức rủi ro
                </span>
                <div style={{ fontSize: 12, color: 'var(--app-text-secondary)', marginTop: 2 }}>
                  Hiệu lực từ: <b>{formatDate(v.effectiveFrom)}</b> ({v.levels.length} mức)
                </div>
              </div>
            ),
          },
          {
            title: 'Cấu hình các mức',
            key: 'levels',
            width: 240,
            render: (_, v) => (
              <Space size={6} wrap>
                {v.levels.map((l) => (
                  <RiskLevelTag key={l.code} code={l.code} />
                ))}
              </Space>
            ),
          },
          {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 140,
            render: (s: RiskLevelVersion['status']) => <ConfigStatusTag status={s} />,
          },
          {
            title: 'Cập nhật lần cuối',
            key: 'updated',
            width: 190,
            render: (_, v) =>
              [v.updatedByName, v.updatedAt ? formatDateTime(v.updatedAt) : null].filter(Boolean).join(' · ') || '—',
          },
          {
            title: 'Thao tác',
            key: 'actions',
            width: actionColumnWidth(3),
            className: 'col-actions',
            align: 'center',
            render: (_, v) => (
              <TableActions
                onView={() => onView(v)}
                onEdit={() => onEdit(v)}
                editAccess={PERMISSIONS.CRITERIA.MANAGE}
                onDelete={v.status === 'SCHEDULED' ? () => onDelete(v) : undefined}
                deleteAccess={PERMISSIONS.CRITERIA.MANAGE}
                recordName={`bảng phân loại ${formatDate(v.effectiveFrom)}`}
              />
            ),
          },
        ]}
      />
    </TableCard>
  )
}

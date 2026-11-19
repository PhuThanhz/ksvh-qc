import { DeleteOutlined } from '@ant-design/icons'
import { Flex, Table, Typography } from 'antd'
import { ActionButton } from '@/components/data-display/TableActions'
import { ConfigStatusTag } from '@/features/criteria/components/ConfigStatusTag'
import type { ConfigStatus, FrequencyConfig } from '@/features/criteria/criteria.types'
import { PERMISSIONS, ProtectedAction } from '@/permissions'
import { formatDate, formatDateTime } from '@/utils/format-date'

export interface FrequencyVersionTableProps {
  configs: FrequencyConfig[]
  loading: boolean
  onDelete: (config: FrequencyConfig) => void
}

/** Các phiên bản kỳ đếm tần suất, mới nhất trước. */
export function FrequencyVersionTable({ configs, loading, onDelete }: FrequencyVersionTableProps) {
  return (
    <Table<FrequencyConfig>
      rowKey="id"
      size="small"
      loading={loading}
      dataSource={configs}
      pagination={false}
      columns={[
        { title: 'Kỳ đếm', dataIndex: 'periodMonths', render: (m: number) => <strong>{m} tháng</strong> },
        { title: 'Áp dụng từ', dataIndex: 'effectiveFrom', render: formatDate },
        { title: 'Trạng thái', dataIndex: 'status', render: (s: ConfigStatus) => <ConfigStatusTag status={s} /> },
        { title: 'Ghi chú', dataIndex: 'note', render: (n: string | null) => n ?? '—' },
        {
          title: 'Người tạo',
          key: 'by',
          render: (_: unknown, c: FrequencyConfig) => (
            <Flex vertical>
              <span>{c.createdByName ?? 'Hệ thống'}</span>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>{formatDateTime(c.createdAt)}</Typography.Text>
            </Flex>
          ),
        },
        {
          title: '',
          key: 'actions',
          width: 50,
          render: (_: unknown, c: FrequencyConfig) =>
            c.status === 'SCHEDULED' && (
              <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
                <ActionButton tone="delete" icon={<DeleteOutlined />} tooltip="Xoá phiên bản" onClick={() => onDelete(c)} />
              </ProtectedAction>
            ),
        },
      ]}
    />
  )
}

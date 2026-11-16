import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Card, Space, Table, Tooltip } from 'antd'
import { ConfigStatusTag } from '@/features/criteria/components/ConfigStatusTag'
import type { RiskLevelVersion } from '@/features/criteria/criteria.types'
import { formatDate, formatDateTime } from '@/utils/format-date'

interface Props {
  versions: readonly RiskLevelVersion[]
  loading: boolean
  selectedDate?: string
  editable: boolean
  onSelect: (effectiveFrom: string) => void
  onDelete: (version: RiskLevelVersion) => void
}

/** Danh sách phiên bản bảng phân loại rủi ro theo ngày hiệu lực. Chỉ xoá được bản sắp áp dụng. */
export function RiskLevelVersionsCard({ versions, loading, selectedDate, editable, onSelect, onDelete }: Props) {
  return (
    <Card title="Các phiên bản" loading={loading} size="small">
      <Table<RiskLevelVersion>
        rowKey="effectiveFrom"
        size="small"
        pagination={false}
        dataSource={[...versions]}
        rowClassName={(v) => (v.effectiveFrom === selectedDate ? 'ant-table-row-selected' : '')}
        columns={[
          { title: 'Hiệu lực từ', dataIndex: 'effectiveFrom', render: formatDate },
          {
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (s: RiskLevelVersion['status']) => <ConfigStatusTag status={s} />,
          },
          {
            title: 'Các mức',
            key: 'levels',
            render: (_, v) => v.levels.map((l) => `${l.code} (${l.remediationDays} ngày)`).join(' · '),
          },
          {
            title: 'Cập nhật',
            key: 'updated',
            render: (_, v) =>
              [v.updatedByName, v.updatedAt ? formatDateTime(v.updatedAt) : null].filter(Boolean).join(' · '),
          },
          {
            title: '',
            key: 'actions',
            width: 96,
            render: (_, v) => (
              <Space size={0}>
                <Tooltip title={v.status === 'SCHEDULED' ? 'Sửa phiên bản' : 'Xem / tạo phiên bản mới từ bản này'}>
                  <Button type="text" icon={<EditOutlined />} aria-label="Chọn phiên bản" onClick={() => onSelect(v.effectiveFrom)} />
                </Tooltip>
                {editable && v.status === 'SCHEDULED' && (
                  <Tooltip title="Xoá phiên bản">
                    <Button type="text" danger icon={<DeleteOutlined />} aria-label="Xoá phiên bản" onClick={() => onDelete(v)} />
                  </Tooltip>
                )}
              </Space>
            ),
          },
        ]}
      />
    </Card>
  )
}

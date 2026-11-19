import { Table, Typography } from 'antd'
import { RiskLevelTag } from '@/components/data-display/RiskLevelTag'
import type { RiskLevel } from '@/features/criteria/criteria.types'

const fmt = (n: number) => n.toLocaleString('vi-VN')

/** Bảng mức rủi ro (chỉ xem): khoảng điểm [min, max), hạn khắc phục, hành động bắt buộc. */
export function RiskLevelView({ levels }: { levels: readonly RiskLevel[] }) {
  return (
    <Table<RiskLevel>
      rowKey="code"
      size="small"
      pagination={false}
      dataSource={[...levels]}
      columns={[
        {
          title: 'Mã',
          dataIndex: 'code',
          width: 80,
          render: (c: string) => <RiskLevelTag code={c} />,
        },
        { title: 'Mức rủi ro', dataIndex: 'name', width: 160 },
        {
          title: 'Khoảng điểm',
          key: 'range',
          width: 200,
          render: (_, l) => (l.maxScore == null ? `Từ ${fmt(l.minScore)} trở lên` : `${fmt(l.minScore)} – dưới ${fmt(l.maxScore)}`),
        },
        {
          title: 'Hạn khắc phục',
          dataIndex: 'remediationDays',
          width: 140,
          render: (d: number) => (d === 0 ? 'Xử lý ngay' : `${d} ngày`),
        },
        {
          title: 'Hành động bắt buộc',
          dataIndex: 'action',
          render: (a?: string | null) => a || <Typography.Text type="secondary">—</Typography.Text>,
        },
      ]}
    />
  )
}

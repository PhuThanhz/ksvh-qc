import { Table, Typography } from 'antd'
import { SeverityTag } from '@/components/data-display/SeverityTag'
import type { RiskLevel } from '@/features/criteria/criteria.types'

const fmt = (n: number) => n.toLocaleString('vi-VN')

/** Bảng mức rủi ro chỉ xem: mức (theo độ nghiêm trọng), khoảng điểm, hạn khắc phục, hành động. */
export function RiskLevelView({ levels }: { levels: readonly RiskLevel[] }) {
  return (
    <Table<RiskLevel>
      rowKey="code"
      size="middle"
      pagination={false}
      dataSource={[...levels]}
      columns={[
        {
          title: 'Mức rủi ro',
          key: 'level',
          width: 220,
          render: (_, l, i) => <SeverityTag code={l.code} name={l.name} index={i} total={levels.length} />,
        },
        {
          title: 'Khoảng điểm',
          key: 'range',
          width: 180,
          render: (_, l) =>
            l.maxScore == null ? (
              <span>từ <b>{fmt(l.minScore)}</b> trở lên</span>
            ) : (
              <span>từ <b>{fmt(l.minScore)}</b> đến dưới <b>{fmt(l.maxScore)}</b></span>
            ),
        },
        {
          title: 'Hạn khắc phục',
          dataIndex: 'remediationDays',
          width: 140,
          render: (d: number) => <b>{d} ngày</b>,
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

import { Card, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { AppealReviewResponse, AppealVerdict, FindingResponse } from '@/features/inspections/inspection.types'
import { formatDate } from '@/utils/format-date'

interface Props {
  finding: FindingResponse
}

const VERDICT_META: Record<AppealVerdict, { label: string; color: string }> = {
  PENDING: { label: 'Chờ thẩm định', color: 'default' },
  FINDING_VALID: { label: 'Giữ lỗi', color: 'volcano' },
  FINDING_INVALID: { label: 'Bỏ lỗi', color: 'green' },
}

export function FindingAppealReviewsCard({ finding }: Props) {
  const reviews = finding.appealReviews
  if (!reviews || reviews.length === 0) return null

  const columns: ColumnsType<AppealReviewResponse> = [
    {
      title: 'Thẩm định viên',
      dataIndex: 'reviewerName',
      key: 'reviewer',
      render: (name: string, r) => (
        <div>
          <span style={{ fontWeight: 600 }}>{name || `Người dùng #${r.reviewerId}`}</span>
          {r.reviewerRoles && (
            <Tag color="blue" style={{ marginLeft: 6, fontSize: 11 }}>
              {r.reviewerRoles}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Ý kiến thẩm định',
      dataIndex: 'verdict',
      key: 'verdict',
      width: 130,
      render: (v: AppealVerdict) => {
        const meta = VERDICT_META[v] ?? { label: v, color: 'default' }
        return <Tag color={meta.color}>{meta.label}</Tag>
      },
    },
    {
      title: 'Nhận xét / Căn cứ',
      dataIndex: 'comment',
      key: 'comment',
      render: (c?: string) => c || '—',
    },
    {
      title: 'Thời điểm',
      dataIndex: 'reviewedAt',
      key: 'reviewedAt',
      width: 140,
      render: (d?: string) => (d ? formatDate(d) : '—'),
    },
  ]

  return (
    <Card
      size="small"
      title={`Hội đồng thẩm định khiếu nại (Vòng ${finding.appealRound || 1} - ${reviews.length} người)`}
    >
      <Table
        dataSource={reviews}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="small"
      />
    </Card>
  )
}

import { EditOutlined, HistoryOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Flex, Skeleton, Typography } from 'antd'
import type { ReactNode } from 'react'
import { PERMISSIONS, ProtectedAction } from '@/permissions'
import { formatDate } from '@/utils/format-date'

export interface RuleSummaryCardProps {
  step: number
  title: string
  /** Một câu: thông số này dùng để làm gì. */
  purpose: ReactNode
  /** Giá trị đang áp dụng, hiển thị to. */
  value?: ReactNode
  /** Các thông số phụ (dòng nhỏ dưới giá trị). */
  details?: ReactNode
  since?: string
  /** Phiên bản đã hẹn ngày áp dụng trong tương lai. */
  scheduled?: { label: ReactNode; from: string }
  footnote?: ReactNode
  loading?: boolean
  emptyText: string
  historyCount: number
  onChange: () => void
  onHistory: () => void
}

/** Thẻ một quy tắc rủi ro: dùng để làm gì → đang áp dụng giá trị nào → Thay đổi / Lịch sử. */
export function RuleSummaryCard(props: RuleSummaryCardProps) {
  const { step, title, purpose, value, details, since, scheduled, footnote, loading, emptyText } = props
  return (
    <Card className="rule-card" styles={{ body: { display: 'flex', flexDirection: 'column', gap: 14, height: '100%' } }}>
      <Flex align="center" gap={10}>
        <span className="rule-card__step">{step}</span>
        <Typography.Title level={5} style={{ margin: 0 }}>{title}</Typography.Title>
      </Flex>
      <Typography.Text type="secondary">{purpose}</Typography.Text>

      <div className="rule-card__current">
        <span className="rule-card__label">Đang áp dụng</span>
        {loading ? (
          <Skeleton active paragraph={{ rows: 1 }} title={false} />
        ) : value ? (
          <>
            <div className="rule-card__value">{value}</div>
            {details && <div className="rule-card__details">{details}</div>}
            {since && <span className="rule-card__since">từ ngày {formatDate(since)}</span>}
          </>
        ) : (
          <Typography.Text type="warning">{emptyText}</Typography.Text>
        )}
      </div>

      {scheduled && (
        <Alert
          type="info"
          showIcon
          message={<>Sẽ đổi thành {scheduled.label} từ ngày {formatDate(scheduled.from)}</>}
        />
      )}
      {footnote && <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>{footnote}</Typography.Text>}

      <Flex gap={8} style={{ marginTop: 'auto' }}>
        <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
          <Button icon={<EditOutlined />} onClick={props.onChange}>Thay đổi</Button>
        </ProtectedAction>
        <Button type="text" icon={<HistoryOutlined />} onClick={props.onHistory}>
          Lịch sử ({props.historyCount})
        </Button>
      </Flex>
    </Card>
  )
}

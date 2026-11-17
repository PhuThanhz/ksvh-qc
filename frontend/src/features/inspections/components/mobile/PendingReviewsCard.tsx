import { Button, Card, Tag } from 'antd-mobile'
import type { FindingActionType } from '@/features/inspections/components/FindingActionModal'
import type { FindingResponse } from '@/features/inspections/inspection.types'

interface Props {
  pendingReviews: FindingResponse[]
  onOpenAction: (f: FindingResponse, a: FindingActionType) => void
}

export function PendingReviewsCard({ pendingReviews, onOpenAction }: Props) {
  if (!pendingReviews.length) return null

  return (
    <Card style={{ borderRadius: 12, background: 'var(--app-warning-bg)', border: '1px solid var(--app-border-warning)' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--app-warning)' }}>
        Yêu cầu thẩm định khiếu nại ({pendingReviews.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {pendingReviews.map((f) => (
          <div key={f.id} style={{ background: 'var(--app-surface)', padding: 10, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>#{f.id} · {f.restaurantName}</span>
              <Tag color="warning">Chờ thẩm định</Tag>
            </div>
            <div style={{ fontSize: 12, color: 'var(--app-text)', marginTop: 2 }}>{f.criterionName}</div>
            {f.appealReason && (
              <div style={{ fontSize: 11, color: 'var(--app-text-secondary)', marginTop: 4 }}>
                Khiếu nại: {f.appealReason}
              </div>
            )}
            <Button
              block
              color="warning"
              size="small"
              style={{ marginTop: 8 }}
              onClick={() => onOpenAction(f, 'SUBMIT_REVIEW')}
            >
              Thẩm định khiếu nại
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
}

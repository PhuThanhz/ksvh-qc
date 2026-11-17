import { Button, Card, ProgressBar } from 'antd-mobile'
import {
  INSPECTION_KIND_LABEL,
  INSPECTION_MODE_LABEL,
  type InspectionKind,
  type InspectionMode,
  type InspectionResponse,
} from '@/features/inspections/inspection.types'

export interface ExecutionHeaderCardProps {
  inspection: InspectionResponse
  totalCriteria: number
  ratedCount: number
  passCount: number
  failCount: number
  naCount: number
  progressPercent: number
  onQuickPassRemaining: () => void
}

export function ExecutionHeaderCard({
  inspection,
  totalCriteria,
  ratedCount,
  passCount,
  failCount,
  naCount,
  progressPercent,
  onQuickPassRemaining,
}: ExecutionHeaderCardProps) {
  const kindLabel = INSPECTION_KIND_LABEL[inspection.inspectionType as InspectionKind] || inspection.inspectionType
  const modeLabel = INSPECTION_MODE_LABEL[inspection.inspectionMode as InspectionMode] || inspection.inspectionMode

  return (
    <Card style={{ marginBottom: 12, borderRadius: 10 }}>
      <div style={{ fontWeight: 600, fontSize: 16 }}>{inspection.restaurantName}</div>
      <div style={{ fontSize: 13, color: 'var(--app-text-secondary)', marginTop: 4 }}>
        {kindLabel} · {modeLabel}
        {inspection.templateName ? ` · Mẫu: ${inspection.templateName}` : ''}
        {inspection.topicNames && inspection.topicNames.length > 0
          ? ` · Chuyên đề: ${inspection.topicNames.join(', ')}`
          : ''}
      </div>
      {inspection.status === 'IN_PROGRESS' && totalCriteria > 0 && (
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--app-text-body)',
              marginBottom: 4,
            }}
          >
            <span>
              Tiến độ: <b>{ratedCount}/{totalCriteria}</b> ({progressPercent}%)
            </span>
            <span>
              {passCount} Đạt · <span style={{ color: 'var(--app-danger)' }}>{failCount} Lỗi</span> · {naCount} N/A
            </span>
          </div>
          <ProgressBar percent={progressPercent} />
          {ratedCount < totalCriteria && (
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
              <Button size="mini" color="primary" fill="outline" onClick={onQuickPassRemaining}>
                ✓ Chấm nhanh các mục còn lại là Đạt
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

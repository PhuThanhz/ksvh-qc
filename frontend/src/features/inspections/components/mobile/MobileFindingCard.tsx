import { Button, Card, Tag } from 'antd-mobile'
import dayjs from 'dayjs'
import { FINDING_STATUS_META } from '../../constants/status'
import type { FindingActionType } from '@/features/inspections/components/FindingActionModal'
import type { FindingResponse } from '@/features/inspections/inspection.types'
import { formatDate } from '@/utils/format-date'

interface Props {
  finding: FindingResponse
  canRespond: boolean
  canRemediate: boolean
  onAction: (finding: FindingResponse, action: FindingActionType) => void
}

export function MobileFindingCard({ finding: f, canRespond, canRemediate, onAction }: Props) {
  const isOverdue = f.deadlineDate && dayjs(f.deadlineDate).isBefore(dayjs(), 'day') && f.status !== 'CLOSED' && f.status !== 'DISMISSED'
  const meta = FINDING_STATUS_META[f.status]
  const tagColor = meta ? (meta.tone === 'processing' ? 'primary' : meta.tone) : 'default'
  const tagLabel = meta ? meta.label : f.status

  return (
    <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          #{f.id} · <span style={{ color: 'var(--app-text-body)' }}>{f.criterionCode}</span>
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <Tag color={f.riskLevelCode === 'M4' ? 'danger' : f.riskLevelCode === 'M3' ? 'warning' : 'primary'}>
            {f.riskLevelCode} - {f.riskLevelName}
          </Tag>
          <Tag color={tagColor}>{tagLabel}</Tag>
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--app-text)' }}>{f.restaurantName}</div>
      <div style={{ fontSize: 13, color: 'var(--app-text-body)', marginTop: 2 }}>{f.criterionName}</div>
      <div style={{ fontSize: 12, color: 'var(--app-danger)', marginTop: 4, background: 'var(--app-danger-bg)', padding: '6px 8px', borderRadius: 6 }}>
        {f.description}
      </div>

      <div style={{ fontSize: 11, color: isOverdue ? 'var(--app-danger)' : 'var(--app-text-secondary)', marginTop: 6, fontWeight: isOverdue ? 600 : 400 }}>
        Hạn khắc phục: {formatDate(f.deadlineDate)} {isOverdue && '(Đã quá hạn!)'}
      </div>

      {f.status === 'OPEN' && canRespond && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
          <Button size="small" color="primary" onClick={() => onAction(f, 'CONFIRM')}>
            Xác nhận lỗi
          </Button>
          <Button size="small" fill="outline" onClick={() => onAction(f, 'APPEAL')}>
            Khiếu nại
          </Button>
        </div>
      )}

      {f.status === 'APPEALED' && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--app-text-body)', textAlign: 'center', background: 'var(--app-surface-sunken)', padding: 6, borderRadius: 6 }}>
          Đang thẩm định khiếu nại · Hội đồng gồm {f.appealReviews?.length || 2} người
        </div>
      )}

      {f.status === 'APPEAL_MEETING' && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--app-text-body)', textAlign: 'center', background: 'var(--app-surface-sunken)', padding: 6, borderRadius: 6 }}>
          Đang họp thống nhất bất đồng · Quản lý KSVH chủ trì
        </div>
      )}

      {f.status === 'CONFIRMED' && canRemediate && (
        <Button block size="small" color="primary" style={{ marginTop: 10 }} onClick={() => onAction(f, 'REMEDIATION_PLAN')}>
          Lập kế hoạch khắc phục
        </Button>
      )}

      {f.status === 'REMEDIATING' && canRemediate && (
        <Button block size="small" color="success" style={{ marginTop: 10 }} onClick={() => onAction(f, 'SUBMIT_REMEDIATION')}>
          Gửi ảnh / Bằng chứng khắc phục
        </Button>
      )}

      {f.status === 'PENDING_VERIFICATION' && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--app-text-body)', textAlign: 'center', background: 'var(--app-surface-sunken)', padding: 6, borderRadius: 6 }}>
          Đã gửi khắc phục · Đang chờ Chuyên viên KSVH nghiệm thu
        </div>
      )}
    </Card>
  )
}

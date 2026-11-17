import { Button, Card, Tag } from 'antd-mobile'
import dayjs from 'dayjs'
import type { FindingActionType } from '@/features/inspections/components/FindingActionModal'
import type { FindingResponse, FindingStatus } from '@/features/inspections/inspection.types'
import { formatDate } from '@/utils/format-date'

interface Props {
  finding: FindingResponse
  canRespond: boolean
  canRemediate: boolean
  onAction: (finding: FindingResponse, action: FindingActionType) => void
}

const STATUS_TAG: Record<FindingStatus, { color: string; label: string }> = {
  OPEN: { color: 'warning', label: 'Chờ phản hồi' },
  CONFIRMED: { color: 'primary', label: 'Đã xác nhận' },
  APPEALED: { color: '#722ed1', label: 'Đang khiếu nại' },
  REMEDIATING: { color: '#fa8c16', label: 'Đang khắc phục' },
  PENDING_VERIFICATION: { color: '#13c2c2', label: 'Chờ nghiệm thu' },
  CLOSED: { color: 'success', label: 'Đã đóng' },
  DISMISSED: { color: 'default', label: 'Đã huỷ' },
}

export function MobileFindingCard({ finding: f, canRespond, canRemediate, onAction }: Props) {
  const isOverdue = f.deadlineDate && dayjs(f.deadlineDate).isBefore(dayjs(), 'day') && f.status !== 'CLOSED' && f.status !== 'DISMISSED'
  const tag = STATUS_TAG[f.status] ?? { color: 'default', label: f.status }

  return (
    <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          #{f.id} · <span style={{ color: '#0071e3' }}>{f.criterionCode}</span>
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <Tag color={f.riskLevelCode === 'M4' ? 'danger' : f.riskLevelCode === 'M3' ? 'warning' : 'primary'}>
            {f.riskLevelCode} - {f.riskLevelName}
          </Tag>
          <Tag color={tag.color}>{tag.label}</Tag>
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{f.restaurantName}</div>
      <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{f.criterionName}</div>
      <div style={{ fontSize: 12, color: '#e11d48', marginTop: 4, background: '#fff1f2', padding: '6px 8px', borderRadius: 6 }}>
        {f.description}
      </div>

      <div style={{ fontSize: 11, color: isOverdue ? '#e11d48' : '#64748b', marginTop: 6, fontWeight: isOverdue ? 600 : 400 }}>
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
        <div style={{ marginTop: 8, fontSize: 12, color: '#0d9488', textAlign: 'center', background: '#f0fdfa', padding: 6, borderRadius: 6 }}>
          Đã gửi khắc phục · Đang chờ Chuyên viên KSVH nghiệm thu
        </div>
      )}
    </Card>
  )
}

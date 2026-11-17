import { ProgressBar } from 'antd-mobile'

interface Props {
  ratedCount: number
  totalCriteria: number
  progressPercent: number
  passCount: number
  failCount: number
  naCount: number
}

export function ExecutionStickyProgress({
  ratedCount,
  totalCriteria,
  progressPercent,
  passCount,
  failCount,
  naCount,
}: Props) {
  if (totalCriteria === 0) return null

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'var(--app-surface)',
        borderBottom: '1px solid var(--app-border)',
        padding: '8px 16px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span>
          Tiến độ: <b>{ratedCount}/{totalCriteria}</b> ({progressPercent}%)
        </span>
        <span>
          <span style={{ color: 'var(--app-success)', fontWeight: 600 }}>{passCount} Đạt</span> ·{' '}
          <span style={{ color: 'var(--app-danger)', fontWeight: 600 }}>{failCount} Lỗi</span> ·{' '}
          <span>{naCount} N/A</span>
        </span>
      </div>
      <ProgressBar percent={progressPercent} />
    </div>
  )
}

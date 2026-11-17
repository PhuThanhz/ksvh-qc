import { Button } from 'antd-mobile'

interface Props {
  pendingCount: number
  isPending: boolean
  ratedCount: number
  totalCriteria: number
  onSubmit: () => void
}

export function ExecutionSubmitBar({
  pendingCount,
  isPending,
  ratedCount,
  totalCriteria,
  onSubmit,
}: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--app-surface)',
        padding: '10px 16px',
        borderTop: '1px solid var(--app-border)',
        zIndex: 100,
      }}
    >
      <Button
        block
        color="primary"
        size="large"
        loading={isPending}
        disabled={pendingCount > 0}
        onClick={onSubmit}
      >
        {pendingCount > 0
          ? `Chờ đồng bộ ${pendingCount} tệp...`
          : `Hoàn thành & Nộp phiếu chấm (${ratedCount}/${totalCriteria})`}
      </Button>
    </div>
  )
}

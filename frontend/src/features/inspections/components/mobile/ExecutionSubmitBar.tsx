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
  const remaining = totalCriteria - ratedCount

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
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.06)',
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
        style={{ height: 48, fontSize: 15, fontWeight: 600, borderRadius: 10 }}
      >
        {pendingCount > 0
          ? `Chờ đồng bộ ${pendingCount} tệp...`
          : remaining > 0
          ? `Gửi kết quả (Còn ${remaining} tiêu chí chưa chấm)`
          : `Gửi kết quả kiểm tra (${ratedCount}/${totalCriteria} tiêu chí)`}
      </Button>
    </div>
  )
}

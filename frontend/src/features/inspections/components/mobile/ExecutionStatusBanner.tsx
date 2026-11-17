import { Card } from 'antd-mobile'

interface Props {
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
  status?: string
  cancelReason?: string
}

export function ExecutionStatusBanner({ isOnline, pendingCount, isSyncing, status, cancelReason }: Props) {
  return (
    <>
      {(!isOnline || pendingCount > 0) && (
        <div
          style={{
            background: '#fffbe6',
            border: '1px solid #ffe58f',
            padding: '6px 12px',
            borderRadius: 8,
            marginBottom: 8,
            fontSize: 12,
            color: '#d46b08',
          }}
        >
          {!isOnline ? '⚠️ Đang offline. ' : ''}
          {pendingCount > 0
            ? `Còn ${pendingCount} tệp chờ tải lên.${isSyncing ? ' Đang đồng bộ...' : ''}`
            : 'Dữ liệu được lưu nháp an toàn.'}
        </div>
      )}

      {status && status !== 'ASSIGNED' && status !== 'IN_PROGRESS' && (
        <Card
          style={{
            borderRadius: 10,
            background: status === 'CANCELLED' ? 'var(--app-danger-bg)' : 'var(--app-success-bg)',
            border: `1px solid ${status === 'CANCELLED' ? 'var(--app-danger-border)' : 'var(--app-success-border)'}`,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: status === 'CANCELLED' ? 'var(--app-danger)' : 'var(--app-success)',
            }}
          >
            {status === 'SUBMITTED' && 'Phiếu chấm đã được nộp. Đang xử lý lỗi.'}
            {status === 'AWAITING_ACK' && 'Phiếu không có lỗi. Chờ CHT xác nhận đã xem.'}
            {status === 'COMPLETED' && 'Phiếu chấm đã hoàn thành toàn diện.'}
            {status === 'CANCELLED' && `Phiếu đã bị huỷ${cancelReason ? `: ${cancelReason}` : ''}.`}
          </div>
        </Card>
      )}
    </>
  )
}

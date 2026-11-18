import { Button, Card, Space } from 'antd-mobile'
import { confirmMobile, mobileToast } from '@/components/feedback/mobileFeedback'
import { useInspectionMutations, useInspections } from '@/features/inspections/hooks/useInspectionData'
import type { InspectionResponse } from '@/features/inspections/inspection.types'
import { getErrorMessage } from '@/lib/http'
import { formatDateTime } from '@/utils/format-date'

/**
 * Phiếu không có lỗi đang chờ CHT xác nhận "đã xem" (DOMAIN_SPEC §4 bước 3).
 * Server chỉ trả phiếu thuộc nhà hàng CHT quản lý và tự kiểm tra đúng CHT khi xác nhận.
 */
export function AckInspectionList() {
  const { data } = useInspections({ status: 'AWAITING_ACK', page: 0, size: 50 })
  const { acknowledge } = useInspectionMutations()
  const items = data?.items ?? []

  if (items.length === 0) return null

  const onAck = async (ins: InspectionResponse) => {
    const ok = await confirmMobile({
      title: 'Xác nhận đã xem phiếu?',
      content: `${ins.code} · ${ins.restaurantName ?? ''}: không có lỗi. Sau khi xác nhận, phiếu hoàn thành.`,
    })
    if (!ok) return
    try {
      await acknowledge.mutateAsync(ins.id)
      mobileToast.success('Đã xác nhận, phiếu hoàn thành')
    } catch (err) {
      mobileToast.fail(getErrorMessage(err))
    }
  }

  return (
    <Space direction="vertical" block>
      <div style={{ fontSize: 15, fontWeight: 600 }}>Phiếu chờ bạn xác nhận đã xem ({items.length})</div>
      {items.map((ins) => (
        <Card key={ins.id} style={{ borderRadius: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--app-text)' }}>{ins.restaurantName}</div>
          <div style={{ fontSize: 12, color: 'var(--app-text-secondary)', marginTop: 2 }}>
            {ins.code} · Chuyên viên {ins.inspectorName ?? '—'}
            {ins.submittedAt ? ` · Gửi ${formatDateTime(ins.submittedAt)}` : ''}
          </div>
          <div style={{ fontSize: 13, color: 'var(--app-success)', marginTop: 6 }}>
            Không có lỗi vi phạm · {ins.passedCriteria}/{ins.totalCriteria} tiêu chí đạt
          </div>
          <Button
            block
            size="small"
            color="primary"
            style={{ marginTop: 10 }}
            loading={acknowledge.isPending}
            onClick={() => void onAck(ins)}
          >
            Xác nhận đã xem
          </Button>
        </Card>
      ))}
    </Space>
  )
}

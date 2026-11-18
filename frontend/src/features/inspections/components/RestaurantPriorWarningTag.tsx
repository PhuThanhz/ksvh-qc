import { AlertOutlined } from '@ant-design/icons'
import { Popover, Tag, Typography } from 'antd'
import { useRestaurantPlanWarning } from '@/features/inspections/hooks/useVerificationAndSurprise'

interface Props {
  restaurantId?: number
  beforeDate?: string
  count?: number
}

export function RestaurantPriorWarningTag({ restaurantId, beforeDate, count }: Props) {
  const shouldFetch = Boolean(restaurantId && (count === undefined || count > 0))
  const { data: warning } = useRestaurantPlanWarning(
    shouldFetch ? restaurantId : undefined,
    beforeDate
  )

  const unresolvedCount = count ?? warning?.totalUnresolvedCount ?? 0
  if (unresolvedCount <= 0) {
    return null
  }

  const content = (
    <div style={{ maxWidth: 320 }}>
      <Typography.Text strong style={{ color: 'var(--app-warning)' }}>
        Lỗi chưa hoàn tất từ tháng trước ({unresolvedCount} lỗi)
      </Typography.Text>
      <div style={{ marginTop: 6, fontSize: 12 }}>
        {warning?.warningDetails && warning.warningDetails.length > 0 ? (
          <ul style={{ paddingLeft: 16, margin: 0 }}>
            {warning.warningDetails.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        ) : (
          <div>Có {unresolvedCount} lỗi vi phạm chưa hoàn tất đóng/nghiệm thu.</div>
        )}
      </div>
    </div>
  )

  return (
    <Popover content={content} title="Cảnh báo kế hoạch" trigger="hover">
      <Tag color="warning" icon={<AlertOutlined />} style={{ cursor: 'pointer' }}>
        {unresolvedCount} lỗi tồn đọng
      </Tag>
    </Popover>
  )
}

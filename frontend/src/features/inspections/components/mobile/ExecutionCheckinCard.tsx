import { Button, Card } from 'antd-mobile'
import type { GeoFix, GeoStatus } from '@/hooks/useGeolocation'

interface Props {
  isRemote: boolean
  geoFix: GeoFix | null
  geoStatus: GeoStatus
  isPending: boolean
  onCheckin: () => void
}

export function ExecutionCheckinCard({ isRemote, geoFix, geoStatus, isPending, onCheckin }: Props) {
  return (
    <Card title="Bắt đầu kiểm tra" style={{ borderRadius: 10 }}>
      <p style={{ fontSize: 14 }}>
        {isRemote
          ? 'Phiếu kiểm tra từ xa: bấm Bắt đầu để mở bảng chấm.'
          : 'Hệ thống ghi nhận vị trí của bạn khi bắt đầu (không bắt buộc có GPS).'}
      </p>
      {!isRemote &&
        (geoFix ? (
          <div
            style={{
              background: 'var(--app-success-bg)',
              border: '1px solid var(--app-success-border)',
              padding: 10,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            <div>
              Toạ độ: {geoFix.lat.toFixed(6)}, {geoFix.lng.toFixed(6)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--app-success)' }}>
              Độ chính xác: ±{Math.round(geoFix.accuracy)}m
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--app-text-secondary)', marginBottom: 12 }}>
            {geoStatus === 'denied' || geoStatus === 'unavailable' || geoStatus === 'insecure'
              ? 'Không lấy được vị trí – vẫn có thể bắt đầu, phiếu sẽ ghi "chưa xác minh vị trí".'
              : 'Đang lấy vị trí…'}
          </div>
        ))}
      <Button block color="primary" size="large" loading={isPending} onClick={onCheckin}>
        Bắt đầu kiểm tra
      </Button>
    </Card>
  )
}

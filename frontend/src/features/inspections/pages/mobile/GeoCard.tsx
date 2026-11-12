import { Button, Card, List, NoticeBar, Tag } from 'antd-mobile'
import type { GeoFix, GeoStatus } from '@/hooks/useGeolocation'

const STATUS_LABEL: Record<GeoStatus, { text: string; color: string }> = {
  idle: { text: 'Chưa dò', color: 'default' },
  locating: { text: 'Đang dò vị trí…', color: 'primary' },
  ready: { text: 'Vị trí tốt', color: 'success' },
  weak: { text: 'Sóng GPS yếu', color: 'warning' },
  denied: { text: 'Bị chặn quyền', color: 'danger' },
  unavailable: { text: 'Không dò được', color: 'danger' },
  insecure: { text: 'Cần HTTPS', color: 'danger' },
}

export interface GeoCardProps {
  status: GeoStatus
  fix: GeoFix | null
  error: string | null
  onLocate: () => void
}

export function GeoCard({ status, fix, error, onLocate }: GeoCardProps) {
  const label = STATUS_LABEL[status]
  return (
    <Card title="Vị trí GPS" extra={<Tag color={label.color}>{label.text}</Tag>}>
      {error && <NoticeBar content={error} color="alert" wrap style={{ marginBottom: 8 }} />}
      {fix && (
        <List>
          <List.Item extra={fix.lat.toFixed(6)}>Vĩ độ</List.Item>
          <List.Item extra={fix.lng.toFixed(6)}>Kinh độ</List.Item>
          <List.Item extra={`±${Math.round(fix.accuracy)} m`}>Sai số</List.Item>
        </List>
      )}
      <Button block color="primary" loading={status === 'locating'} onClick={onLocate} style={{ marginTop: 8 }}>
        {fix ? 'Dò lại vị trí' : 'Lấy vị trí'}
      </Button>
    </Card>
  )
}

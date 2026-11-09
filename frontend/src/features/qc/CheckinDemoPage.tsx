import { Button, Card, Image, List, NoticeBar, ProgressBar, Space, Tag } from 'antd-mobile'
import { useRef, useState } from 'react'
import { useAuthStore } from '@/features/auth/authStore'
import { useGeolocation, type GeoStatus } from '@/shared/hooks/useGeolocation'
import { usePhotoCapture, type CapturedPhoto } from '@/shared/hooks/usePhotoCapture'

const STATUS_LABEL: Record<GeoStatus, { text: string; color: string }> = {
  idle: { text: 'Chưa dò', color: 'default' },
  locating: { text: 'Đang dò vị trí…', color: 'primary' },
  ready: { text: 'Vị trí tốt', color: 'success' },
  weak: { text: 'Sóng GPS yếu', color: 'warning' },
  denied: { text: 'Bị chặn quyền', color: 'danger' },
  unavailable: { text: 'Không dò được', color: 'danger' },
  insecure: { text: 'Cần HTTPS', color: 'danger' },
}

/** Trang thử GPS và chụp ảnh có đóng dấu. Màn check-in thật sẽ dùng lại 2 hook này. */
export function CheckinDemoPage() {
  const user = useAuthStore((s) => s.user)
  const geo = useGeolocation({ maxAccuracy: 50 })
  const photo = usePhotoCapture()
  const inputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<CapturedPhoto[]>([])
  const label = STATUS_LABEL[geo.status]

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // cho phép chụp lại cùng file
    if (!file) return
    const lines = [
      geo.fix ? `GPS ${geo.fix.lat.toFixed(6)}, ${geo.fix.lng.toFixed(6)} (±${Math.round(geo.fix.accuracy)}m)` : 'GPS: chưa có',
      `Người chấm: ${user?.fullName ?? ''}`,
    ]
    const result = await photo.process(file, lines)
    if (result) setPhotos((p) => [result, ...p])
  }

  return (
    <Space direction="vertical" block style={{ padding: 12 }}>
      <Card title="Vị trí GPS" extra={<Tag color={label.color}>{label.text}</Tag>}>
        {geo.error && <NoticeBar content={geo.error} color="alert" wrap style={{ marginBottom: 8 }} />}
        {geo.fix && (
          <List>
            <List.Item extra={geo.fix.lat.toFixed(6)}>Vĩ độ</List.Item>
            <List.Item extra={geo.fix.lng.toFixed(6)}>Kinh độ</List.Item>
            <List.Item extra={`±${Math.round(geo.fix.accuracy)} m`}>Sai số</List.Item>
          </List>
        )}
        <Button block color="primary" loading={geo.status === 'locating'} onClick={geo.locate} style={{ marginTop: 8 }}>
          {geo.fix ? 'Dò lại vị trí' : 'Lấy vị trí'}
        </Button>
      </Card>

      <Card title="Chụp ảnh bằng chứng">
        {/* capture="environment" mở camera sau của máy, dùng app camera gốc (lấy nét, HDR, flash). */}
        <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
        <Button
          block
          size="large"
          color="success"
          loading={photo.step === 'processing' || photo.step === 'uploading'}
          onClick={() => inputRef.current?.click()}
        >
          Chụp ảnh
        </Button>
        {photo.step === 'uploading' && <ProgressBar percent={photo.progress} style={{ marginTop: 8 }} />}
        {photo.error && <NoticeBar content={photo.error} color="alert" wrap style={{ marginTop: 8 }} />}
        <Space wrap style={{ marginTop: 12 }}>
          {photos.map((p) => (
            <Image key={p.objectKey} src={p.previewUrl} width={96} height={96} fit="cover" style={{ borderRadius: 8 }} />
          ))}
        </Space>
      </Card>
    </Space>
  )
}

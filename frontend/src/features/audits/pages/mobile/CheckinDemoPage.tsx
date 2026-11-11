import { Button, Card, Image, NoticeBar, ProgressBar, Space } from 'antd-mobile'
import { useRef, useState, type ChangeEvent } from 'react'
import { useSession } from '@/features/auth'
import { usePhotoCapture, type CapturedPhoto } from '@/features/media'
import { GeoCard } from '@/features/audits/pages/mobile/GeoCard'
import { useGeolocation } from '@/hooks/useGeolocation'

/** Trang thử GPS và chụp ảnh có đóng dấu. Màn check-in thật sẽ dùng lại các hook này. */
export function CheckinDemoPage() {
  const { user } = useSession()
  const geo = useGeolocation()
  const photo = usePhotoCapture()
  const inputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<CapturedPhoto[]>([])
  const busy = photo.step === 'processing' || photo.step === 'uploading'

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // cho phép chụp lại cùng file
    if (!file) return
    const gps = geo.fix
      ? `GPS ${geo.fix.lat.toFixed(6)}, ${geo.fix.lng.toFixed(6)} (±${Math.round(geo.fix.accuracy)}m)`
      : 'GPS: chưa có'
    const result = await photo.process(file, [gps, `Người chấm: ${user?.fullName ?? ''}`])
    if (result) setPhotos((p) => [result, ...p])
  }

  return (
    <Space direction="vertical" block style={{ padding: 12 }}>
      <GeoCard status={geo.status} fix={geo.fix} error={geo.error} onLocate={geo.locate} />
      <Card title="Chụp ảnh bằng chứng">
        {/* capture="environment": mở camera sau bằng app camera gốc (lấy nét, HDR, flash). */}
        <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
        <Button block size="large" color="success" loading={busy} onClick={() => inputRef.current?.click()}>
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

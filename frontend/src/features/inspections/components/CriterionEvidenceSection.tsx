import { CameraOutlined, DeleteOutlined } from '@ant-design/icons'
import { Button, Image, ProgressBar, Space } from 'antd-mobile'
import { useRef, type ChangeEvent } from 'react'
import { isVideoUrl, toMediaUrl } from '@/utils/media-url'

interface Props {
  evidenceList: string[]
  readOnly: boolean
  isBusy: boolean
  photoStep: string
  photoProgress: number
  photoError: string | null
  onCapturePhoto: (e: ChangeEvent<HTMLInputElement>) => void
  onRemovePhoto: (url: string) => void
}

export function CriterionEvidenceSection({
  evidenceList,
  readOnly,
  isBusy,
  photoStep,
  photoProgress,
  photoError,
  onCapturePhoto,
  onRemovePhoto,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div style={{ marginTop: 8 }}>
      {!readOnly && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/mp4,video/quicktime"
            capture="environment"
            hidden
            onChange={onCapturePhoto}
          />
          <Button
            size="small"
            color="primary"
            fill="outline"
            loading={isBusy}
            onClick={() => inputRef.current?.click()}
            style={{ width: '100%' }}
          >
            <CameraOutlined style={{ marginRight: 6 }} /> Chụp ảnh / Quay video bằng chứng
          </Button>
          {photoStep === 'uploading' && <ProgressBar percent={photoProgress} style={{ marginTop: 6 }} />}
          {photoError && <div style={{ color: 'var(--app-danger)', fontSize: 12, marginTop: 4 }}>{photoError}</div>}
        </>
      )}

      {evidenceList.length > 0 && (
        <Space wrap style={{ marginTop: 8 }}>
          {evidenceList.map((url) => {
            const isVid = isVideoUrl(url)
            return (
              <div key={url} style={{ position: 'relative', display: 'inline-block' }}>
                {isVid ? (
                  <video src={toMediaUrl(url)} controls style={{ width: 80, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                ) : (
                  <Image lazy src={toMediaUrl(url)} width={64} height={64} fit="cover" style={{ borderRadius: 6 }} />
                )}
                {!readOnly && (
                  <Button
                    size="mini"
                    color="danger"
                    onClick={() => onRemovePhoto(url)}
                    style={{ position: 'absolute', top: -6, right: -6, padding: '0 4px', height: 20, minWidth: 20, borderRadius: 10 }}
                  >
                    <DeleteOutlined style={{ fontSize: 10 }} />
                  </Button>
                )}
              </div>
            )
          })}
        </Space>
      )}
    </div>
  )
}

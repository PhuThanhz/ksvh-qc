import { CameraOutlined, DeleteOutlined } from '@ant-design/icons'
import { Button, Card, Image, ProgressBar, Space, Tag, TextArea, Toast } from 'antd-mobile'
import { useRef, type ChangeEvent } from 'react'
import { FindingRemediationInfo } from '@/features/inspections/components/FindingRemediationInfo'
import { usePhotoCapture } from '@/features/media'
import type { InspectionItemResponse, ItemResult } from '@/features/inspections/inspection.types'
import { toMediaUrl } from '@/utils/media-url'

export interface CriterionRating {
  result: ItemResult
  comment?: string
  evidenceUrls?: string
}

interface Props {
  index: number
  item: InspectionItemResponse
  rating: CriterionRating
  onSetResult: (res: ItemResult) => void
  onSetComment: (comment: string) => void
  onSetEvidence: (evidenceUrls: string) => void
  inspectorName?: string
  restaurantName?: string
  gpsCoords?: string
  readOnly?: boolean
}

export function InspectionCriterionCard({
  index,
  item,
  rating,
  onSetResult,
  onSetComment,
  onSetEvidence,
  inspectorName,
  restaurantName,
  gpsCoords,
  readOnly = false,
}: Props) {
  const photo = usePhotoCapture()
  const inputRef = useRef<HTMLInputElement>(null)
  const isBusy = photo.step === 'processing' || photo.step === 'uploading'

  const onCapturePhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const lines: string[] = []
    if (restaurantName) lines.push(`Nhà hàng: ${restaurantName}`)
    if (inspectorName) lines.push(`Chuyên viên: ${inspectorName}`)
    if (gpsCoords) lines.push(gpsCoords)

    const captured = await photo.process(file, lines)
    if (captured) {
      const currentUrls = rating.evidenceUrls ? rating.evidenceUrls.split(',').map((u) => u.trim()).filter(Boolean) : []
      currentUrls.push(captured.objectKey)
      onSetEvidence(currentUrls.join(', '))
      Toast.show({ icon: 'success', content: 'Đã tải ảnh bằng chứng lên' })
    }
  }

  const onRemovePhoto = (urlToRemove: string) => {
    const urls = rating.evidenceUrls ? rating.evidenceUrls.split(',').map((u) => u.trim()).filter(Boolean) : []
    const updated = urls.filter((u) => u !== urlToRemove)
    onSetEvidence(updated.join(', '))
  }

  const evidenceList = rating.evidenceUrls
    ? rating.evidenceUrls.split(',').map((u) => u.trim()).filter(Boolean)
    : []

  return (
    <Card style={{ borderRadius: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>
          {index}. {item.criterionName}
        </div>
        <Tag color="default" style={{ marginLeft: 8 }}>Ảnh hưởng {item.baseImpact}/5</Tag>
      </div>
      <div style={{ fontSize: 12, color: 'var(--app-text-secondary)', marginTop: 2 }}>
        {item.groupName} · {item.criterionCode}
      </div>

      <FindingRemediationInfo
        findingId={item.findingId}
        findingDescription={item.findingDescription}
        findingEvidenceUrls={item.findingEvidenceUrls}
        remediationPlan={item.remediationPlan}
        remediationEvidenceUrls={item.remediationEvidenceUrls}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
        <Button
          size="small"
          disabled={readOnly}
          color={rating.result === 'PASS' ? 'success' : 'default'}
          fill={rating.result === 'PASS' ? 'solid' : 'outline'}
          onClick={() => onSetResult('PASS')}
        >
          Đạt
        </Button>
        <Button
          size="small"
          disabled={readOnly}
          color={rating.result === 'FAIL' ? 'danger' : 'default'}
          fill={rating.result === 'FAIL' ? 'solid' : 'outline'}
          onClick={() => onSetResult('FAIL')}
        >
          Không đạt
        </Button>
        <Button
          size="small"
          disabled={readOnly}
          color={rating.result === 'NA' ? 'primary' : 'default'}
          fill={rating.result === 'NA' ? 'solid' : 'outline'}
          onClick={() => onSetResult('NA')}
        >
          N/A
        </Button>
      </div>

      {rating.result === 'FAIL' && (
        <div style={{ marginTop: 10, background: 'var(--app-danger-bg)', padding: 8, borderRadius: 6, border: '1px solid var(--app-danger-border)' }}>
          <TextArea
            placeholder={
              readOnly
                ? 'Không có mô tả'
                : item.findingId
                  ? 'Lý do nghiệm thu chưa đạt (bắt buộc)...'
                  : 'Mô tả lỗi vi phạm phát hiện (bắt buộc)...'
            }
            rows={2}
            readOnly={readOnly}
            value={rating.comment ?? ''}
            onChange={onSetComment}
            style={{ background: 'var(--app-surface)', padding: 6, borderRadius: 4 }}
          />

          <div style={{ marginTop: 8 }}>
            {!readOnly && (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
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
                  <CameraOutlined style={{ marginRight: 6 }} /> Chụp ảnh / Chọn ảnh bằng chứng
                </Button>
                {photo.step === 'uploading' && <ProgressBar percent={photo.progress} style={{ marginTop: 6 }} />}
                {photo.error && <div style={{ color: 'var(--app-danger)', fontSize: 12, marginTop: 4 }}>{photo.error}</div>}
              </>
            )}

            {evidenceList.length > 0 && (
              <Space wrap style={{ marginTop: 8 }}>
                {evidenceList.map((url) => (
                  <div key={url} style={{ position: 'relative', display: 'inline-block' }}>
                    <Image lazy src={toMediaUrl(url)} width={64} height={64} fit="cover" style={{ borderRadius: 6 }} />
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
                ))}
              </Space>
            )}

          </div>
        </div>
      )}

      {rating.result === 'NA' && (
        <div style={{ marginTop: 10, background: 'var(--app-info-bg)', padding: 8, borderRadius: 6, border: '1px solid var(--app-info-border)' }}>
          <TextArea
            placeholder={readOnly ? 'Không có lý do' : 'Lý do chọn N/A (bắt buộc: thiết bị cũ, ngoại cảnh...)...'}
            rows={2}
            readOnly={readOnly}
            value={rating.comment ?? ''}
            onChange={onSetComment}
            style={{ background: 'var(--app-surface)', padding: 6, borderRadius: 4 }}
          />
        </div>
      )}
    </Card>
  )
}

import { Button, Card, Tag, TextArea, Toast } from 'antd-mobile'
import type { ChangeEvent } from 'react'
import { CriterionEvidenceSection } from '@/features/inspections/components/CriterionEvidenceSection'
import { FindingRemediationInfo } from '@/features/inspections/components/FindingRemediationInfo'
import { usePhotoCapture } from '@/features/media'
import type { InspectionItemResponse, ItemResult } from '@/features/inspections/inspection.types'

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
  inspectionId?: number
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
  inspectionId,
  inspectorName,
  restaurantName,
  gpsCoords,
  readOnly = false,
}: Props) {
  const photo = usePhotoCapture()
  const isBusy = photo.step === 'processing' || photo.step === 'uploading'

  const onCapturePhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const lines: string[] = []
    if (restaurantName) lines.push(`Nhà hàng: ${restaurantName}`)
    if (inspectorName) lines.push(`Chuyên viên: ${inspectorName}`)
    if (gpsCoords) lines.push(gpsCoords)

    const captured = await photo.process(file, lines, {
      inspectionId: inspectionId ?? 0,
      criterionId: item.criterionId,
    })
    if (captured) {
      const currentUrls = rating.evidenceUrls ? rating.evidenceUrls.split(',').map((u) => u.trim()).filter(Boolean) : []
      currentUrls.push(captured.objectKey)
      onSetEvidence(currentUrls.join(', '))
      Toast.show({
        icon: captured.isOffline ? 'warning' : 'success',
        content: captured.isOffline ? 'Đã lưu ngoại tuyến (tự đồng bộ khi có mạng)' : 'Đã tải bằng chứng lên',
      })
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
          disabled={readOnly}
          color={rating.result === 'PASS' ? 'success' : 'default'}
          fill={rating.result === 'PASS' ? 'solid' : 'outline'}
          style={{ height: 44, fontSize: 14, fontWeight: 600, borderRadius: 8 }}
          onClick={() => onSetResult('PASS')}
        >
          Đạt
        </Button>
        <Button
          disabled={readOnly}
          color={rating.result === 'FAIL' ? 'danger' : 'default'}
          fill={rating.result === 'FAIL' ? 'solid' : 'outline'}
          style={{ height: 44, fontSize: 14, fontWeight: 600, borderRadius: 8 }}
          onClick={() => onSetResult('FAIL')}
        >
          Không đạt
        </Button>
        <Button
          disabled={readOnly}
          color={rating.result === 'NA' ? 'primary' : 'default'}
          fill={rating.result === 'NA' ? 'solid' : 'outline'}
          style={{ height: 44, fontSize: 14, fontWeight: 600, borderRadius: 8 }}
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

          <CriterionEvidenceSection
            evidenceList={evidenceList}
            readOnly={readOnly}
            isBusy={isBusy}
            photoStep={photo.step}
            photoProgress={photo.progress}
            photoError={photo.error}
            onCapturePhoto={onCapturePhoto}
            onRemovePhoto={onRemovePhoto}
          />
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

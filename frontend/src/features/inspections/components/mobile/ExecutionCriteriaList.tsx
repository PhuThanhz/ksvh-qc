import { Segmented, Space } from 'antd-mobile'
import { useState } from 'react'
import { InspectionCriterionCard } from '@/features/inspections/components/InspectionCriterionCard'
import type { InspectionItemResponse, ItemResult } from '@/features/inspections/inspection.types'

interface Props {
  items?: InspectionItemResponse[]
  totalCriteria: number
  ratedCount: number
  failCount: number
  insId: number
  inspectorName?: string
  restaurantName?: string
  gpsCoords?: string
  readOnly: boolean
  getRating: (item: InspectionItemResponse) => { result: ItemResult; comment?: string; evidenceUrls?: string }
  onSetResult: (criterionId: number, result: ItemResult) => void
  onSetComment: (criterionId: number, comment: string) => void
  onSetEvidence: (criterionId: number, urls: string) => void
}

export function ExecutionCriteriaList({
  items,
  totalCriteria,
  ratedCount,
  failCount,
  insId,
  inspectorName,
  restaurantName,
  gpsCoords,
  readOnly,
  getRating,
  onSetResult,
  onSetComment,
  onSetEvidence,
}: Props) {
  const [filterMode, setFilterMode] = useState<'all' | 'unrated' | 'fail'>('all')

  const displayedItems = (items ?? []).filter((it) => {
    if (filterMode === 'unrated') return getRating(it).result === 'UNRATED'
    if (filterMode === 'fail') return getRating(it).result === 'FAIL'
    return true
  })

  return (
    <Space direction="vertical" block>
      {!readOnly && totalCriteria > 5 && (
        <Segmented
          value={filterMode}
          onChange={(v) => setFilterMode(v as 'all' | 'unrated' | 'fail')}
          options={[
            { label: `Tất cả (${totalCriteria})`, value: 'all' },
            { label: `Chưa chấm (${totalCriteria - ratedCount})`, value: 'unrated' },
            { label: `Lỗi (${failCount})`, value: 'fail' },
          ]}
          style={{ marginBottom: 4 }}
        />
      )}

      {displayedItems.map((it) => {
        const originalIndex = (items ?? []).findIndex((orig) => orig.id === it.id) + 1
        return (
          <InspectionCriterionCard
            key={it.id}
            index={originalIndex}
            item={it}
            rating={getRating(it)}
            onSetResult={(res: ItemResult) => onSetResult(it.criterionId, res)}
            onSetComment={(comment: string) => onSetComment(it.criterionId, comment)}
            onSetEvidence={(urls: string) => onSetEvidence(it.criterionId, urls)}
            inspectionId={insId}
            inspectorName={inspectorName}
            restaurantName={restaurantName}
            gpsCoords={gpsCoords}
            readOnly={readOnly}
          />
        )
      })}
    </Space>
  )
}

import { useEffect, useState } from 'react'
import type { CriterionRating } from '@/features/inspections/components/InspectionCriterionCard'
import type { ItemResult } from '@/features/inspections/inspection.types'
import { useOfflineSync } from '@/features/media'

const DRAFT_PREFIX = 'qc_draft_ins_'

export function useInspectionDraft(insId: number, status?: string) {
  const [overrides, setOverrides] = useState<Record<number, Partial<CriterionRating>>>(() => {
    try {
      const saved = localStorage.getItem(`${DRAFT_PREFIX}${insId}`)
      return saved ? (JSON.parse(saved) as Record<number, Partial<CriterionRating>>) : {}
    } catch {
      return {}
    }
  })

  const { isOnline, pendingCount, isSyncing } = useOfflineSync(insId, (critId, newKey) => {
    setOverrides((prev) => {
      const cur = prev[critId]?.evidenceUrls ?? ''
      const updated = cur
        .split(',')
        .map((u) => u.trim())
        .filter((u) => !u.startsWith('offline:'))
        .concat(newKey)
        .join(', ')
      return { ...prev, [critId]: { ...prev[critId], evidenceUrls: updated } }
    })
  })

  useEffect(() => {
    if (status === 'IN_PROGRESS' && Object.keys(overrides).length > 0) {
      try {
        localStorage.setItem(`${DRAFT_PREFIX}${insId}`, JSON.stringify(overrides))
      } catch {}
    } else if (status && status !== 'IN_PROGRESS' && status !== 'ASSIGNED') {
      try {
        localStorage.removeItem(`${DRAFT_PREFIX}${insId}`)
      } catch {}
    }
  }, [overrides, insId, status])

  const setCriterionResult = (critId: number, result: ItemResult) =>
    setOverrides((prev) => ({ ...prev, [critId]: { ...prev[critId], result } }))

  const setCriterionComment = (critId: number, comment: string) =>
    setOverrides((prev) => ({ ...prev, [critId]: { ...prev[critId], comment } }))

  const setCriterionEvidence = (critId: number, evidenceUrls: string) =>
    setOverrides((prev) => ({ ...prev, [critId]: { ...prev[critId], evidenceUrls } }))

  const clearDraft = () => {
    try {
      localStorage.removeItem(`${DRAFT_PREFIX}${insId}`)
    } catch {}
  }

  const getRating = (it: {
    criterionId: number
    result?: ItemResult
    comment?: string
    evidenceUrls?: string
  }): CriterionRating => {
    const o = overrides[it.criterionId]
    return {
      result: o?.result ?? it.result ?? 'UNRATED',
      comment: o?.comment ?? it.comment ?? '',
      evidenceUrls: o?.evidenceUrls ?? it.evidenceUrls ?? '',
    }
  }

  return {
    overrides,
    setOverrides,
    isOnline,
    pendingCount,
    isSyncing,
    setCriterionResult,
    setCriterionComment,
    setCriterionEvidence,
    clearDraft,
    getRating,
  }
}

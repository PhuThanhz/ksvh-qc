import type { CriterionGroup } from '@/features/criteria/criteria.types'

export interface BatchItem {
  key: string
  code: string
  name: string
  baseImpact: number
  checkMethod: string
}

export interface BatchCriterionModalProps {
  open: boolean
  group?: CriterionGroup
  groups?: readonly CriterionGroup[]
  onClose: () => void
  onSuccess?: () => void
}

export function getPrefix(groupCode?: string): string {
  if (!groupCode) return 'TC'
  return groupCode.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'TC'
}

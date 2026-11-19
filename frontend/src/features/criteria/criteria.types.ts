import type { components } from '@/types/api.generated'
import type { PageParams } from '@/types/common.types'

type Schemas = components['schemas']

export interface CriterionTemplateRef {
  id: number
  code: string
  name: string
}

export type CriterionGroup = Schemas['CriterionGroupResponse'] & {
  companyId?: number | null
  companyName?: string | null
}
export type CriterionGroupPayload = Omit<Schemas['CriterionGroupRequest'], 'companyId'> & {
  companyId?: number | null
}
export type Criterion = Omit<Schemas['CriterionResponse'], 'templates'> & {
  templates?: CriterionTemplateRef[]
}
export type CriterionPayload = Omit<Schemas['CriterionRequest'], 'templateIds'> & {
  templateIds?: number[]
}
export type Template = Schemas['TemplateResponse'] & {
  companyId?: number | null
  companyName?: string | null
}
export type TemplatePayload = Omit<Schemas['TemplateRequest'], 'companyId'> & {
  companyId?: number | null
}
export type TemplateOption = Schemas['TemplateOption']
export type RiskLevel = Schemas['RiskLevelItem']
export type RiskLevelVersion = Schemas['RiskLevelVersionResponse']
export type RiskLevelVersionPayload = Schemas['RiskLevelVersionRequest']
export type FrequencyConfig = Schemas['FrequencyConfigResponse']
export type FrequencyConfigPayload = Schemas['FrequencyConfigRequest']
export type EscalationRule = Schemas['EscalationRuleResponse']
export type EscalationRulePayload = Schemas['EscalationRuleRequest']
export type ConfigStatus = FrequencyConfig['status']

export interface CriterionListParams extends PageParams {
  keyword?: string
  companyId?: number
  groupId?: number
  templateId?: number
  assignedToTemplate?: boolean
  active?: boolean
}

export interface TemplateListParams extends PageParams {
  keyword?: string
  companyId?: number
  active?: boolean
}

/** Thang mức ảnh hưởng đã chốt 12/11/2026 (khớp backend Criterion.MIN_IMPACT/MAX_IMPACT). */
export const IMPACT_LEVELS = [1, 2, 3, 4, 5] as const

export const CONFIG_STATUS_META: Record<ConfigStatus, { label: string; tone: 'success' | 'processing' | 'default' }> = {
  CURRENT: { label: 'Đang áp dụng', tone: 'success' },
  SCHEDULED: { label: 'Sắp áp dụng', tone: 'processing' },
  PAST: { label: 'Đã thay thế', tone: 'default' },
}

/** Nhãn loại kiểm tra lưu trên mẫu phiếu (giá trị cũ có thể là chữ tự do). */
export const INSPECTION_TYPE_LABEL: Record<string, string> = { PERIODIC: 'Định kỳ', SURPRISE: 'Đột xuất' }

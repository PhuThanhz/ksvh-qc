import type { CriterionListParams, TemplateListParams } from '@/features/criteria/criteria.types'
import type { Id } from '@/types/common.types'

/** Query key của module criteria. Sau khi ghi: invalidateQueries({ queryKey: criteriaKeys.<nhánh> }). */
export const criteriaKeys = {
  all: ['criteria'] as const,
  groups: (companyId?: number) => [...criteriaKeys.all, 'groups', companyId] as const,
  criteria: () => [...criteriaKeys.all, 'items'] as const,
  list: (params: CriterionListParams) => [...criteriaKeys.criteria(), 'list', params] as const,
  options: () => [...criteriaKeys.criteria(), 'options'] as const,
  templates: () => [...criteriaKeys.all, 'templates'] as const,
  templateList: (params: TemplateListParams) => [...criteriaKeys.templates(), 'list', params] as const,
  templateOptions: () => [...criteriaKeys.templates(), 'options'] as const,
  template: (id: Id) => [...criteriaKeys.templates(), 'detail', id] as const,
  riskLevels: () => [...criteriaKeys.all, 'risk-levels'] as const,
  riskPreview: (baseImpact: number, violations: number) => [...criteriaKeys.all, 'risk-preview', baseImpact, violations] as const,
  riskLevelVersions: () => [...criteriaKeys.riskLevels(), 'versions'] as const,
  frequency: () => [...criteriaKeys.all, 'frequency'] as const,
  escalation: () => [...criteriaKeys.all, 'escalation'] as const,
}

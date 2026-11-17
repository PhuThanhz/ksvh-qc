import type {
  Criterion,
  CriterionGroup,
  CriterionGroupPayload,
  CriterionListParams,
  CriterionPayload,
  EscalationRule,
  EscalationRulePayload,
  FrequencyConfig,
  FrequencyConfigPayload,
  RiskLevel,
  RiskLevelVersion,
  RiskLevelVersionPayload,
  Template,
  TemplateListParams,
  TemplateOption,
  TemplatePayload,
} from '@/features/criteria/criteria.types'
import { api, downloadFile, uploadExcel } from '@/lib/http'
import type { Id, PageResponse } from '@/types/common.types'

const PATH = {
  criteriaExport: '/criteria/export',
  criteriaImportTemplate: '/criteria/import-template',
  criteriaImport: '/criteria/import',
  templatesExport: '/inspection-templates/export',
  templatesImportTemplate: '/inspection-templates/import-template',
  templatesImport: '/inspection-templates/import',
  groups: '/criterion-groups',
  group: (id: Id) => `/criterion-groups/${id}`,
  criteria: '/criteria',
  criterionOptions: '/criteria/options',
  criterion: (id: Id) => `/criteria/${id}`,
  templates: '/inspection-templates',
  templateOptions: '/inspection-templates/options',
  template: (id: Id) => `/inspection-templates/${id}`,
  riskLevels: '/risk-levels',
  riskLevelVersions: '/risk-levels/versions',
  riskLevelVersion: (effectiveFrom: string) => `/risk-levels/versions/${effectiveFrom}`,
  frequency: '/frequency-configs',
  frequencyItem: (id: Id) => `/frequency-configs/${id}`,
  escalation: '/escalation-rules',
  escalationItem: (id: Id) => `/escalation-rules/${id}`,
} as const

const data = <T,>(r: { data: T }) => r.data

export const criteriaApi = {
  groups: (companyId?: number) =>
    api.get<CriterionGroup[]>(PATH.groups, { params: companyId ? { companyId } : undefined }).then(data),
  createGroup: (body: CriterionGroupPayload) => api.post<CriterionGroup>(PATH.groups, body).then(data),
  updateGroup: (id: Id, body: CriterionGroupPayload) => api.put<CriterionGroup>(PATH.group(id), body).then(data),

  list: ({ keyword, ...rest }: CriterionListParams) =>
    api.get<PageResponse<Criterion>>(PATH.criteria, { params: { ...rest, keyword: keyword || undefined } }).then(data),
  options: () => api.get<Criterion[]>(PATH.criterionOptions).then(data),
  create: (body: CriterionPayload) => api.post<Criterion>(PATH.criteria, body).then(data),
  createBatch: (body: CriterionPayload[]) => api.post<Criterion[]>(`${PATH.criteria}/batch`, body).then(data),
  update: (id: Id, body: CriterionPayload) => api.put<Criterion>(PATH.criterion(id), body).then(data),
  delete: (id: Id) => api.delete<void>(PATH.criterion(id)).then(() => undefined),
}

export const templatesApi = {
  list: ({ keyword, ...rest }: TemplateListParams) =>
    api.get<PageResponse<Template>>(PATH.templates, { params: { ...rest, keyword: keyword || undefined } }).then(data),
  options: () => api.get<TemplateOption[]>(PATH.templateOptions).then(data),
  get: (id: Id) => api.get<Template>(PATH.template(id)).then(data),
  create: (body: TemplatePayload) => api.post<Template>(PATH.templates, body).then(data),
  update: (id: Id, body: TemplatePayload) => api.put<Template>(PATH.template(id), body).then(data),
  delete: (id: Id) => api.delete<void>(PATH.template(id)).then(() => undefined),
}

export const riskConfigApi = {
  riskLevels: () => api.get<RiskLevel[]>(PATH.riskLevels).then(data),
  riskLevelVersions: () => api.get<RiskLevelVersion[]>(PATH.riskLevelVersions).then(data),
  saveRiskLevelVersion: (body: RiskLevelVersionPayload) => api.put<RiskLevelVersion>(PATH.riskLevels, body).then(data),
  deleteRiskLevelVersion: (effectiveFrom: string) =>
    api.delete<void>(PATH.riskLevelVersion(effectiveFrom)).then(() => undefined),
  frequency: () => api.get<FrequencyConfig[]>(PATH.frequency).then(data),
  createFrequency: (body: FrequencyConfigPayload) => api.post<FrequencyConfig>(PATH.frequency, body).then(data),
  deleteFrequency: (id: Id) => api.delete<void>(PATH.frequencyItem(id)).then(() => undefined),
  escalation: () => api.get<EscalationRule[]>(PATH.escalation).then(data),
  createEscalation: (body: EscalationRulePayload) => api.post<EscalationRule>(PATH.escalation, body).then(data),
  deleteEscalation: (id: Id) => api.delete<void>(PATH.escalationItem(id)).then(() => undefined),
}

/** Nhập / xuất Excel: nhóm tiêu chí + tiêu chí (một file), mẫu phiếu (một file). */
export const criteriaExcelApi = {
  exportCriteria: () => downloadFile(PATH.criteriaExport),
  criteriaTemplate: () => downloadFile(PATH.criteriaImportTemplate),
  importCriteria: (file: File, commit: boolean) => uploadExcel(PATH.criteriaImport, file, commit),
  exportTemplates: () => downloadFile(PATH.templatesExport),
  templatesTemplate: () => downloadFile(PATH.templatesImportTemplate),
  importTemplates: (file: File, commit: boolean) => uploadExcel(PATH.templatesImport, file, commit),
}

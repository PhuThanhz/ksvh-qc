import type { components } from '@/types/api.generated'
import type { PageResponse } from '@/types/common.types'

export * from './plan.types'
export * from './finding.types'

type Schemas = components['schemas']

export type ItemResult = Schemas['InspectionItemResponse']['result']

export type InspectionItemResponse = Omit<
  Schemas['InspectionItemResponse'],
  | 'comment'
  | 'evidenceUrls'
  | 'evaluatedAt'
  | 'findingId'
  | 'findingDescription'
  | 'findingEvidenceUrls'
  | 'remediationPlan'
  | 'remediationEvidenceUrls'
  | 'groupName'
> & {
  groupName?: string
  comment?: string
  evidenceUrls?: string
  evaluatedAt?: string
  findingId?: number
  findingDescription?: string
  findingEvidenceUrls?: string
  remediationPlan?: string
  remediationEvidenceUrls?: string
  findingStatus?: string
}

/** Loại kiểm tra: định kỳ tháng (đủ mẫu phiếu, thực tế) / đột xuất (theo chuyên đề) / kiểm tra khắc phục. */
export type InspectionKind = Schemas['InspectionResponse']['inspectionType']
/** Hình thức: thực tế tại nhà hàng / từ xa. */
export type InspectionMode = Schemas['InspectionResponse']['inspectionMode']
/** Kết quả xác nhận vị trí khi bắt đầu (chỉ ghi nhận, không chặn). */
export type LocationStatus = NonNullable<Schemas['InspectionResponse']['locationStatus']>

export const INSPECTION_KIND_LABEL: Record<InspectionKind, string> = {
  PERIODIC: 'Định kỳ tháng',
  SURPRISE: 'Đột xuất',
  VERIFICATION: 'Kiểm tra khắc phục',
}
export const INSPECTION_MODE_LABEL: Record<InspectionMode, string> = { ON_SITE: 'Thực tế tại nhà hàng', REMOTE: 'Từ xa' }
export const LOCATION_STATUS_META: Record<LocationStatus, { label: string; color: string }> = {
  VERIFIED: { label: 'Đúng vị trí', color: 'success' },
  OUTSIDE_RADIUS: { label: 'Ngoài bán kính', color: 'warning' },
  UNVERIFIED: { label: 'Chưa xác minh vị trí', color: 'default' },
  REMOTE: { label: 'Kiểm tra từ xa', color: 'processing' },
}

export type InspectionResponse = Omit<
  Schemas['InspectionResponse'],
  | 'items'
  | 'locationStatus'
  | 'templateId'
  | 'templateName'
  | 'planId'
  | 'restaurantName'
  | 'inspectorName'
  | 'complianceScore'
  | 'cancelReason'
  | 'checkinLat'
  | 'checkinLng'
  | 'checkinDistanceM'
  | 'checkinAt'
  | 'submittedAt'
  | 'completedAt'
  | 'acknowledgedAt'
  | 'maxRiskLevel'
  | 'notes'
> & {
  planId?: number
  restaurantName?: string
  templateId?: number | null
  templateName?: string | null
  inspectorName?: string
  locationStatus?: LocationStatus | null
  complianceScore?: number | null
  adjustedComplianceScore?: number | null
  cancelReason?: string
  checkinLat?: number
  checkinLng?: number
  checkinDistanceM?: number
  checkinAt?: string
  submittedAt?: string
  completedAt?: string
  acknowledgedAt?: string | null
  maxRiskLevel?: string
  notes?: string
  items?: InspectionItemResponse[]
}

export type InspectionCreateRequest = Schemas['InspectionCreateRequest'] & {
  criterionIds?: number[]
}
export type InspectionBatchCreateRequest = Schemas['InspectionBatchCreateRequest'] & {
  criterionIds?: number[]
}
export type InspectionCheckinRequest = Partial<Schemas['InspectionCheckinRequest']>
export type InspectionSubmitItemRequest = Schemas['InspectionSubmitItemRequest']
export type InspectionSubmitRequest = Schemas['InspectionSubmitRequest']
export type InspectionCancelRequest = Schemas['InspectionCancelRequest']
export type CandidateFindingResponse = Schemas['CandidateFindingResponse']
export type SurpriseInspectionSuggestion = Schemas['SurpriseInspectionSuggestion']
export type PriorFindingsWarning = Schemas['PriorFindingsWarning']
export type InspectorScheduleItem = Schemas['InspectorScheduleItem']

export type InspectionPageResponse = PageResponse<InspectionResponse>
